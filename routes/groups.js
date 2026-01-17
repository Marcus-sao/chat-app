const express = require('express');
const router = express.Router();
const Group = require('../models/group'); // Ensure this file exists in /models/group.js
const auth = require('../middleware/auth');

// --- CREATE GROUP ---
router.post('/create', auth, async (req, res) => {
    try {
        const { name, description, memberIds, isPrivate } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Group name is required' });
        }

        // Initialize members array with the creator
        const members = [{ user: req.user._id, role: 'admin' }];

        // Add others
        if (Array.isArray(memberIds)) {
            memberIds.forEach(id => {
                if (id && id.toString() !== req.user._id.toString()) {
                    members.push({ user: id, role: 'member' });
                }
            });
        }

        const group = new Group({
            name: name.trim(),
            description: description || 'No description provided',
            creator: req.user._id,
            members: members,
            isPrivate: isPrivate || false
        });

        const savedGroup = await group.save();
        // Return the group so the frontend can see it
        res.status(201).json(savedGroup);
    } catch (error) {
        console.error("❌ Group Creation Error:", error);
        res.status(500).json({ error: 'Server failed to create group' });
    }
});

// --- ADD MEMBER TO GROUP ---
router.post('/:groupId/add-member', auth, async (req, res) => {
    try {
        const { userId } = req.body;
        const group = await Group.findById(req.params.groupId);
        if (!group) return res.status(404).json({ error: 'Group not found' });

        // Only admin/creator can add people (optional check)
        const isMember = group.members.some(m => m.user.toString() === userId);
        if (isMember) return res.status(400).json({ error: 'User already in group' });

        group.members.push({ user: userId, role: 'member' });
        await group.save();
        res.json({ message: 'Member added' });
    } catch (err) { res.status(500).json({ error: 'Failed to add member' }); }
});

// --- DELETE GROUP ---
router.delete('/:groupId', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) return res.status(404).json({ error: 'Group not found' });
        
        // Only creator can delete
        if (group.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only the creator can delete this group' });
        }

        await Group.findByIdAndDelete(req.params.groupId);
        res.json({ message: 'Group deleted successfully' });
    } catch (err) { res.status(500).json({ error: 'Delete failed' }); }
});
// --- GET MY GROUPS ---
router.get('/my-groups', auth, async (req, res) => {
    try {
        // Find groups where the current user's ID exists in the members.user field
        const groups = await Group.find({ 'members.user': req.user._id })
            .sort({ updatedAt: -1 });
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

module.exports = router;