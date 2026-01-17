require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const groupRoutes = require('./routes/groups');
const Message = require('./models/message');
const User = require('./models/user');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// INITIALIZE AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const AI_BOT_ID = "677d9c66e765432101234567";

// AI Model configuration - UPDATED FOR 2026
const AI_MODELS = {
    primary: "gemini-1.5-flash", // Use 2.5 Flash for the best speed/reliability
    fallback: "gemini-2.5-pro",
    legacy: "gemini-2.0-flash"
};
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Make io accessible to routes
app.set('io', io);

// This version uses your online link on Render, 
// but still works on your personal computer (local) if the link is missing.
const dbURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chat-app';

mongoose.connect(dbURI)
    .then(() => console.log('✅ Database connected successfully!'))
    .catch(err => {
        console.error('❌ Database connection failed!');
        console.error('Reason:', err.message);
    });

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const activeUsers = {}; 

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // ✅ User connects - set online status
    socket.on('user_connected', async (userId) => {
        if (!userId) return;
        activeUsers[userId] = socket.id;
        
        try {
            await User.findByIdAndUpdate(userId, { isOnline: true });
            
            // Tell everyone to refresh their lists
            io.emit('user_status_changed', { userId, isOnline: true });
            io.emit('users_updated', Object.keys(activeUsers));
        } catch (error) {
            console.error('Status error:', error);
        }
    });

    socket.on('join_group', (groupId) => {
    socket.join(groupId);
    console.log(`User ${socket.id} joined room: ${groupId}`);
});

socket.on('send_message', async (data) => {
    try {
        const { senderId, receiverId, groupId, content, imageUrl } = data;

        const msgData = {
            sender: senderId,
            content: content || "",
            imageUrl: imageUrl || null,
            messageType: groupId ? 'group' : 'direct',
            createdAt: new Date()
        };

        if (groupId) {
            msgData.group = groupId;
        } else {
            msgData.receiver = receiverId;
            // keep BOTH for schema compatibility
        }

        // ✅ Save once
        const savedMsg = await Message.create(msgData);

        // ✅ Populate sender
        const populatedMsg = await Message.findById(savedMsg._id)
            .populate('sender', 'name username');

        // ✅ GROUP CHAT
        if (groupId) {
            io.to(groupId).emit('receive_message', populatedMsg);
            return;
        }

        // ✅ DIRECT CHAT
        // send to sender
        socket.emit('receive_message', populatedMsg);

        // send to receiver
        if (activeUsers[receiverId]) {
            io.to(activeUsers[receiverId]).emit('receive_message', populatedMsg);
        }

        // ✅ AI BOT (direct only)
        if (receiverId === AI_BOT_ID) {
            socket.emit('ai_typing', { isTyping: true });

            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent(content || "Hello");
                const aiText = result.response.text();

                const aiMsg = await Message.create({
                    sender: AI_BOT_ID,
                    receiver: senderId,
                    recipient: senderId,
                    content: aiText,
                    messageType: 'direct',
                    createdAt: new Date()
                });

                socket.emit('receive_message', {
                    ...aiMsg.toJSON(),
                    sender: {
                        _id: AI_BOT_ID,
                        name: "Mul Chat Bot",
                        username: "mulchatbot"
                    }
                });

            } finally {
                socket.emit('ai_typing', { isTyping: false });
            }
        }

    } catch (err) {
        console.error('❌ send_message error:', err);
        socket.emit('message_error', { error: 'Message failed to send' });
    }
});


    // Handle typing indicators
    socket.on('typing', (data) => {
        const { receiverId, isTyping } = data;
        if (activeUsers[receiverId]) {
            io.to(activeUsers[receiverId]).emit('user_typing', { isTyping });
        }
    });

    socket.on('group_typing', (data) => {
        const { groupId, userId, username, isTyping } = data;
        socket.to(groupId).emit('user_group_typing', { 
            userId, 
            username, 
            isTyping 
        });
    });

    // ✅ User disconnects - set offline status
    socket.on('disconnect', async () => {
        let foundUserId = null;
        
        // Find who owned this socket
        for (const [userId, socketId] of Object.entries(activeUsers)) {
            if (socketId === socket.id) {
                foundUserId = userId;
                delete activeUsers[userId]; // Remove from online list
                break;
            }
        }

        if (foundUserId) {
            try {
                // Update DB to offline
                await User.findByIdAndUpdate(foundUserId, { 
                    isOnline: false, 
                    lastSeen: new Date() 
                });
                
                // Tell everyone they are gone
                io.emit('user_status_changed', { userId: foundUserId, isOnline: false });
                io.emit('users_updated', Object.keys(activeUsers));
                console.log(`👤 User ${foundUserId} went offline.`);
            } catch (err) {
                console.error("Disconnect Error:", err);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Uploads directory: ${uploadsDir}`);
    console.log(`🤖 AI Bot ID: ${AI_BOT_ID}`);
    console.log(`🧠 AI Models configured:`, AI_MODELS);

});



