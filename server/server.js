const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const mindMapRoutes = require('./routes/mindMapRoutes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Test route to confirm backend is running
app.get('/api/test', (req, res) => {
    res.json({ message: "Backend server is running!" });
});

// Health check: the frontend uses this to decide between the API and local demo mode
app.get('/api/health', (req, res) => {
    res.json({ ok: true, db: mongoose.connection.readyState === 1 });
});

// Connect MongoDB using async/await
async function connectDB() {
    try {
        if (!process.env.MONGO_URI) {
            console.warn("⚠️  MONGO_URI is not set: the app will run in local demo mode");
            return;
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected successfully");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err.message);
    }
}
connectDB();

// Routes
app.use('/api/mindmaps', mindMapRoutes);

// Validation errors become 400s; anything else is a 500 without leaking details
app.use((err, req, res, _next) => { // Express needs 4 arguments to treat this as an error handler
    if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
