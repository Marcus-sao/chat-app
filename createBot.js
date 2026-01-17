require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');

const AI_BOT_ID = "677d9c66e765432101234567";

async function createBot() {
    await mongoose.connect(process.env.MONGODB_URI);
    const botExists = await User.findById(AI_BOT_ID);
    if (!botExists) {
        await User.create({
            _id: AI_BOT_ID,
            name: "Mul Chat Bot",
            username: "mulchatbot",
            email: "bot@maranatha.edu.ng",
            password: "system_generated_bot_password_123",
            isOnline: true
        });
        console.log("✅ AI Bot User Created in Database!");
    } else {
        console.log("🤖 Bot already exists.");
    }
    process.exit();
}

createBot();
