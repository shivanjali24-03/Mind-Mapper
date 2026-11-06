const mongoose = require('mongoose');

const mindMapSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 120 },
        // React Flow nodes and edges are stored as-is
        nodes: { type: Array, default: [] },
        edges: { type: Array, default: [] },
    },
    { timestamps: true } // adds createdAt and updatedAt
);

module.exports = mongoose.model('MindMap', mindMapSchema);
