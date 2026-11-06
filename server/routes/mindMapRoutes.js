const express = require('express');
const mongoose = require('mongoose');
const MindMap = require('../models/MindMap');

const router = express.Router();

// Reject malformed ids early with a clear 400 instead of a cast error
router.param('id', (req, res, next, id) => {
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid mind map id' });
    next();
});

// Only accept the fields we expect
function pickMap(body = {}) {
    const out = {};
    if (typeof body.title === 'string') out.title = body.title.trim().slice(0, 120) || 'Untitled map';
    if (Array.isArray(body.nodes)) out.nodes = body.nodes;
    if (Array.isArray(body.edges)) out.edges = body.edges;
    return out;
}

// List maps (lightweight: no nodes/edges), newest first
router.get('/', async (req, res, next) => {
    try {
        const maps = await MindMap.find({}, 'title updatedAt createdAt').sort({ updatedAt: -1 }).lean();
        res.json(maps);
    } catch (err) {
        next(err);
    }
});

// Get one map with its nodes and edges
router.get('/:id', async (req, res, next) => {
    try {
        const map = await MindMap.findById(req.params.id).lean();
        if (!map) return res.status(404).json({ error: 'Mind map not found' });
        res.json(map);
    } catch (err) {
        next(err);
    }
});

// Create a map
router.post('/', async (req, res, next) => {
    try {
        const map = await MindMap.create({ title: 'Untitled map', ...pickMap(req.body) });
        res.status(201).json(map);
    } catch (err) {
        next(err);
    }
});

// Update title, nodes or edges
router.put('/:id', async (req, res, next) => {
    try {
        const map = await MindMap.findByIdAndUpdate(req.params.id, pickMap(req.body), {
            new: true,
            runValidators: true,
        }).lean();
        if (!map) return res.status(404).json({ error: 'Mind map not found' });
        res.json(map);
    } catch (err) {
        next(err);
    }
});

// Delete a map
router.delete('/:id', async (req, res, next) => {
    try {
        const map = await MindMap.findByIdAndDelete(req.params.id);
        if (!map) return res.status(404).json({ error: 'Mind map not found' });
        res.status(204).end();
    } catch (err) {
        next(err);
    }
});

module.exports = router;
