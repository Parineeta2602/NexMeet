const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },

    description: {
        type: String,
        required: true,
    },

    date: {
        type: Date,
        required: true,
    },

    venue: {
        type: String,
        required: true,
    },

    seats: {
        type: Number,
        required: true,
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Event lifecycle
    status: {
        type: String,
        enum: ["upcoming", "ongoing", "completed"],
        default: "upcoming"
    },

    // Past event information
    pastEvent: {
        summary: {
            type: String,
            default: ""
        },

        highlights: {
            type: [String],
            default: []
        },

        photos: {
            type: [String],
            default: []
        },

        published: {
            type: Boolean,
            default: false
        }
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Event", eventSchema);