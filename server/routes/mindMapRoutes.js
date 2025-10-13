const express = require('express');
const router = express.Router();
const MindMap = require('../models/MindMap');

// Create a new mind map
router.post('/', async (req, res) => {
    try {
        const mindMap = new MindMap(req.body);
        const saved = await mindMap.save();
        res.json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all mind maps
router.get('/', async (req, res) => {
    try {
        const mindMaps = await MindMap.find();
        res.json(mindMaps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
