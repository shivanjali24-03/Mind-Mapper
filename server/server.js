const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const mindMapRoutes = require('./routes/mindMapRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Test route to confirm backend is running
app.get('/api/test', (req, res) => {
    res.json({ message: "Backend server is running!" });
});

// Connect MongoDB using async/await
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected successfully");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err.message);
    }
}
connectDB();

// Routes
app.use('/api/mindmaps', mindMapRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
