const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema(
    {
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: [true, 'Client ID is required'],
        },
        freelancerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Freelancer',
            required: [true, 'Freelancer ID is required'],
        },
        projectTitle: {
            type: String,
            required: [true, 'Project title is required'],
            trim: true,
            maxlength: [150, 'Project title cannot exceed 150 characters'],
        },
        description: {
            type: String,
            required: [true, 'Project description is required'],
            trim: true,
            maxlength: [3000, 'Description cannot exceed 3000 characters'],
        },
        budgetType: {
            type: String,
            enum: {
                values: ['fixed', 'hourly'],
                message: '{VALUE} is not a valid budget type',
            },
            required: [true, 'Budget type is required'],
        },
        budgetAmount: {
            type: Number,
            required: [true, 'Budget amount is required'],
            min: [1, 'Budget amount must be at least 1'],
        },
        deadline: {
            type: Date,
            required: [true, 'Deadline is required'],
        },
        message: {
            type: String,
            trim: true,
            default: '',
            maxlength: [1000, 'Message cannot exceed 1000 characters'],
        },
        status: {
            type: String,
            enum: {
                values: ['pending', 'accepted', 'declined', 'expired'],
                message: '{VALUE} is not a valid status',
            },
            default: 'pending',
        },
    },
    {
        timestamps: true, // createdAt & updatedAt
    }
);

// One client can only send one active invitation to a freelancer at a time
invitationSchema.index({ clientId: 1, freelancerId: 1, status: 1 });

const Invitation = mongoose.model('Invitation', invitationSchema);

module.exports = Invitation;
