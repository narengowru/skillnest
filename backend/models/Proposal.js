const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: [true, "Project ID is required"],
        },
        freelancerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Freelancer",
            required: [true, "Freelancer ID is required"],
        },
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: [true, "Client ID is required"],
        },
        bidAmount: {
            type: Number,
            required: [true, "Bid amount is required"],
            min: [1, "Bid amount must be at least 1"],
        },
        deliveryTime: {
            type: Number,
            required: [true, "Delivery time is required"],
            min: [1, "Delivery time must be at least 1 day"],
        },
        proposalText: {
            type: String,
            required: [true, "Proposal text is required"],
            trim: true,
            minlength: [20, "Proposal text must be at least 20 characters"],
            maxlength: [2000, "Proposal text cannot exceed 2000 characters"],
        },
        status: {
            type: String,
            enum: {
                values: ["pending", "accepted", "rejected", "withdrawn", "order-created"],
                message: "{VALUE} is not a valid status",
            },
            default: "pending",
        },
    },
    {
        timestamps: true, // createdAt & updatedAt
    }
);

// Prevent a freelancer from submitting duplicate proposals on the same project
proposalSchema.index({ projectId: 1, freelancerId: 1 }, { unique: true });

const Proposal = mongoose.model("Proposal", proposalSchema);

module.exports = Proposal;
