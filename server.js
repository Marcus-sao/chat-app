require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');

// ✅ UPDATED 2026: Using the new stable library
const { GoogleGenAI } = require('@google/genai');

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

// ✅ INITIALIZE AI CLIENT (2026 Style)
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const AI_BOT_ID = "677d9c66e765432101234567";

// ✅ AI Model configuration - GEMINI 3 IS NOW STABLE
const AI_MODELS = {
    primary: "gemini-3-flash", 
    fallback: "gemini-3-pro"
};

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.set('io', io);

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

    socket.on('user_connected', async (userId) => {
        if (!userId) return;
        activeUsers[userId] = socket.id;
        
        try {
            await User.findByIdAndUpdate(userId, { isOnline: true });
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
            }

            const savedMsg = await Message.create(msgData);
            const populatedMsg = await Message.findById(savedMsg._id)
                .populate('sender', 'name username');

            if (groupId) {
                io.to(groupId).emit('receive_message', populatedMsg);
                return;
            }

            socket.emit('receive_message', populatedMsg);

            if (activeUsers[receiverId]) {
                io.to(activeUsers[receiverId]).emit('receive_message', populatedMsg);
            }

            // ✅ AI BOT LOGIC - UPDATED FOR 2026 SDK
            if (receiverId === AI_BOT_ID) {
                socket.emit('ai_typing', { isTyping: true });

                try {
                    // New generateContent call structure
                    const response = await client.models.generateContent({
                        model: AI_MODELS.primary,
                        contents: [{ role: 'user', parts: [{ text: content || "Hello" }] }]
                    });

                    const aiText = response.text; // Direct access to text

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

                } catch (aiErr) {
                    console.error('🤖 AI Generation Error:', aiErr);
                    socket.emit('message_error', { error: 'AI is busy, try again later.' });
                } finally {
                    socket.emit('ai_typing', { isTyping: false });
                }
            }

        } catch (err) {
            console.error('❌ send_message error:', err);
            socket.emit('message_error', { error: 'Message failed to send' });
        }
    });

    socket.on('typing', (data) => {
        const { receiverId, isTyping } = data;
        if (activeUsers[receiverId]) {
            io.to(activeUsers[receiverId]).emit('user_typing', { isTyping });
        }
    });

    socket.on('disconnect', async () => {
        let foundUserId = null;
        for (const [userId, socketId] of Object.entries(activeUsers)) {
            if (socketId === socket.id) {
                foundUserId = userId;
                delete activeUsers[userId];
                break;
            }
        }

        if (foundUserId) {
            try {
                await User.findByIdAndUpdate(foundUserId, { 
                    isOnline: false, 
                    lastSeen: new Date() 
                });
                io.emit('user_status_changed', { userId: foundUserId, isOnline: false });
                io.emit('users_updated', Object.keys(activeUsers));
            } catch (err) {
                console.error("Disconnect Error:", err);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🤖 AI Bot Active: ${AI_BOT_ID}`);
    console.log(`🧠 Model: ${AI_MODELS.primary}`);
});
