import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/connectDb.js";
import User from './modals/user.modal.js'
import Redis from "ioredis";
import rateLimiter from "./middleware/ratelimit.js";
import sendEmail from "./config/sendEmail.js";

dotenv.config();

const app = express();
const redis = new Redis(process.env.REDIS_URL);
const PORT = process.env.PORT || 8000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello redis");
});

// Create User API
app.post("/api/users", async (req, res) => {

    try {

        const { name, email, password } = req.body;

        const user = await User.create({
            name,
            email,
            password
        });

        // Delete old Redis cache
        await redis.del("users:all");

        await sendEmail();

        res.status(201).json({
            message: "User created successfully",
            user
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});

// get api user
app.get("/api/users", async (req, res) => {

    try {

        const users = await User.find();

        res.status(200).json({
            message: "Users fetched successfully",
            users
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});

app.get("/api/get-users", rateLimiter, async (req, res) => {

    try {

        // Check Redis cache first
        const cachedUsers = await redis.get("users:all");

        if (cachedUsers) {
            return res.status(200).json({
                source: "Redis Cache",
                users: JSON.parse(cachedUsers)
            });
        }

        // If cache miss, fetch from MongoDB
        const users = await User.find();

        // Store users in Redis for 60 seconds
        await redis.set("users:all", JSON.stringify(users));

        res.status(200).json({
            source: "MongoDB",
            users
        });

    } catch (error) {

        res.status(500).json({ message: error.message });

    }

});

// create and send otp
app.post("/api/send-otp", async (req, res) => {

    const { email } = req.body;

    try {

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await redis.set(`otp:${email}`, otp, "EX", 30);

        res.json({
            message: "Test OTP generated",
            otp,
            expiresIn: "30 seconds"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }

});

// Verify OTP
app.post("/api/verify-otp", async (req, res) => {

    try {

        const { email, otp } = req.body;

        const savedOTP = await redis.get(`otp:${email}`);

        if (!savedOTP) {
            return res.status(400).json({
                message: "OTP expired or not found"
            });
        }

        if (savedOTP !== String(otp)) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        await redis.del(`otp:${email}`);

        res.status(200).json({
            message: "OTP verified successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// start server funciton
const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server start failed:", error.message);
        process.exit(1);
    }
};

startServer();

// without redis - 78 ms
