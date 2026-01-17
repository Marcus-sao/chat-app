const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Sender is required'],
        index: true
    },
    // recipient replaces receiver (unified naming)
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        set: function(val) {
            if (val && this.receiver?.toString() !== val.toString()) {
                this.receiver = val;
            }
            return val;
        }
    },
    // receiver kept for backward compatibility
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        set: function(val) {
            if (val && this.recipient?.toString() !== val.toString()) {
                this.recipient = val;
            }
            return val;
        }
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'direct', 'group', 'file'],
        default: 'text'
    },
    content: {
        type: String,
        trim: true,
        // FIXED: Increased to 50,000 characters to allow for long AI Math solutions
        maxlength: [50000, 'Message cannot exceed 50000 characters'], 
        required: function() {
            // Content only optional if a file or image exists
            return !this.file?.url && !this.imageUrl;
        }
    },
    imageUrl: { type: String, default: null },
    file: {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        url: String
    },
    // Multi-user read tracking for groups
    readBy: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now }
    }],
    isRead: { type: Boolean, default: false },
    readAt: { type: Date }
}, {
    timestamps: true, 
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ==================== INDEXES (ESR Rule) ====================
messageSchema.index({ recipient: 1, sender: 1, createdAt: -1 });
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ group: 1, createdAt: -1 });

// ==================== VIRTUALS ====================
messageSchema.virtual('formattedTime').get(function() {
    return this.createdAt ? this.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
});

// ==================== MIDDLEWARE ====================
messageSchema.pre('save', function(next) {
    // 1. Determine if it's a group or direct message FIRST
    if (this.group) {
        this.messageType = 'group';
    } else {
        this.messageType = 'direct';
    }

    // 2. OVERRIDE type if there is an image or file (This makes UI rendering easier)
    if (this.imageUrl || (this.file && this.file.mimetype && this.file.mimetype.startsWith('image/'))) {
        this.messageType = 'image';
    } else if (this.file && this.file.url) {
        this.messageType = 'file';
    } else {
        // If neither image nor file, it's just text
        this.messageType = this.group ? 'group' : 'direct';
    }
    
    next();
});

// ==================== METHODS ====================
messageSchema.methods.markAsRead = async function(userId) {
    if (this.group) {
        const alreadyRead = this.readBy.some(r => r.user && r.user.toString() === userId.toString());
        if (!alreadyRead) {
            this.readBy.push({ user: userId });
        }
    } else {
        this.isRead = true;
        this.readAt = Date.now();
    }
    return this.save();
};

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);