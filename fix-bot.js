const mongoose = require('mongoose');
const User = require('../models/user'); // Adjust path
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const botId = "677d9c66e765432101234567";
    const exists = await User.findById(botId);
    if (!exists) {
        await User.create({
            _id: botId,
            name: "Mul Chat Bot",
            username: "mulchatbot",
            email: "bot@mul.edu.ng",
            password: "hashed_password_here",
            isOnline: true
        });
        console.log("✅ Bot Created!");
    } else {
        console.log("🤖 Bot already exists.");
    }
    process.exit();
});