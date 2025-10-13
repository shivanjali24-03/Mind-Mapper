const mongoose = require('mongoose');

const mindMapSchema = new mongoose.Schema({
    title: { type: String, required: true },
    nodes: { type: Array, default: [] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MindMap', mindMapSchema);
