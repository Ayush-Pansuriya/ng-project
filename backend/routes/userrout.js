const express = require('express');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const User = require('../schema/user'); 
const user = require('../schema/user');
const router = express.Router();
router.post('/register', async (req, res) => {
    try {
        const { email, password, role = 'user' } = req.body; // Default role to 'user'

        // Check for missing fields
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            email,
            password: hashedPassword
        });

        await user.save();
        const token = jwt.sign(
            { id: user._id, email: user.email },
            "your_secret_key",
            { expiresIn: "1h" }
        );

        res.status(201).json({ message: "User registered successfully", token });
    } catch (err) {
        console.error("Error during registration:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // Generate Token
        const token = jwt.sign({ id: user._id, email: user.email }, "your_secret_key", { expiresIn: "1h" });
         
        res.json({ message: "Login successful", token });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
// Logout route
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: "Logged out successfully" });
});
// Get all users
router.get('/getalluser', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:email', async (req, res) => {
    try {
        const user = await User.findOneAndDelete({ email: req.params.email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User deleted successfully" });
    }
 catch (err) {
        res.status(500).json({ message: err.message });
    }
}
);
module.exports = router;
