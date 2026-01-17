const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Message = require('../models/message');
const Group = require('../models/group');
const authMiddleware = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images, documents, and other common file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// ==================== LEGACY ROUTES (Original) ====================

// ROUTE 1: Get conversation between current user and another user (LEGACY)
router.get('/conversation/:otherUserId', authMiddleware, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const currentUserId = req.userId || req.user?._id;

    const messages = await Message.find({
      messageType: 'direct',
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name username');

    res.json(messages);

  } catch (error) {
    console.error('❌ Error fetching direct messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// ROUTE 2: Send a new message (LEGACY - without file upload)
router.post('/send', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { receiverId, recipientId, content } = req.body;
    const targetUserId = receiverId || recipientId;

    // Validate input
    if (!targetUserId) {
      return res.status(400).json({ 
        error: 'Receiver ID is required' 
      });
    }

    if (!content && !req.file) {
      return res.status(400).json({ 
        error: 'Message content or file is required' 
      });
    }

    if (content && content.trim().length === 0 && !req.file) {
      return res.status(400).json({ 
        error: 'Message cannot be empty' 
      });
    }

    const userId = req.userId || req.user?._id;

    // Create new message
    const messageData = {
      sender: userId,
      receiver: targetUserId,
      content: content ? content.trim() : '',
      messageType: 'direct',
      timestamp: new Date(),
      createdAt: new Date()
    };

    // Add file data if file was uploaded
    if (req.file) {
      messageData.file = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        url: `/uploads/${req.file.filename}`
      };
      
      // Set messageType to image if it's an image file
      if (req.file.mimetype.startsWith('image/')) {
        messageData.messageType = 'image';
        messageData.imageUrl = `/uploads/${req.file.filename}`;
      } else {
        messageData.messageType = 'file';
      }
    }

    const message = new Message(messageData);
    await message.save();

    // Populate sender and receiver info
    await message.populate('sender', 'name username email');
    await message.populate('receiver', 'name username email');

    // Emit socket event (if you have socket.io setup)
    if (req.app.get('io')) {
      req.app.get('io').to(targetUserId).emit('newMessage', message);
    }

    res.status(201).json({ 
      message: 'Message sent successfully',
      data: message 
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      error: 'Server error sending message',
      details: error.message 
    });
  }
});

// ==================== NEW GROUP MESSAGE ROUTES ====================

// Send a group message
router.post('/send-group', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { groupId, content } = req.body;
    const userId = req.userId || req.user?._id;

    if (!content && !req.file) {
      return res.status(400).json({ error: 'Message content or file is required' });
    }

    // Verify user is member of group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isMember = group.members.some(
      m => m.user.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const messageData = {
      sender: userId,
      group: groupId,
      messageType: 'group',
      content: content || '',
      timestamp: new Date(),
      createdAt: new Date()
    };

    // Add file data if file was uploaded
    if (req.file) {
      messageData.file = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        url: `/uploads/${req.file.filename}`
      };
      
      if (req.file.mimetype.startsWith('image/')) {
        messageData.imageUrl = `/uploads/${req.file.filename}`;
      }
    }
    

    const message = new Message(messageData);
    await message.save();
    await message.populate('sender', 'name username email');

    // Emit socket event to all group members
    if (req.app.get('io')) {
      req.app.get('io').to(`group-${groupId}`).emit('newGroupMessage', message);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending group message:', error);
    res.status(500).json({ error: 'Failed to send group message' });
  }
});

// Get group messages
router.get('/group/:groupId', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;

    // Verify user is member of group
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isMember = group.members.some(
      m => m.user.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const messages = await Message.find({
      group: req.params.groupId
    })
    .populate('sender', 'name username email')
    .sort({ createdAt: 1, timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({ error: 'Failed to fetch group messages' });
  }
});

// ==================== MARK AS READ ROUTES ====================

// Mark message as read (LEGACY - single message)
router.put('/read/:messageId', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId || req.user?._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Use the helper method from the model
    await message.markAsRead(userId);

    res.json({ 
      message: 'Message marked as read',
      data: message 
    });

  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark message as read (NEW - supports groups)
router.post('/:messageId/read', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    const userId = req.userId || req.user?._id;
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Use the helper method from the model
    await message.markAsRead(userId);

    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

module.exports = router;