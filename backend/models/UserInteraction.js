const mongoose = require('mongoose');

// UserInteraction model to track all user interactions for recommendation system
const userInteractionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'userModel'
    },
    userModel: {
        type: String,
        required: true,
        enum: ['Freelancer', 'Client']
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'itemModel'
    },
    itemModel: {
        type: String,
        required: true,
        enum: ['Job', 'Freelancer', 'Client']
    },
    interactionType: {
        type: String,
        required: true,
        enum: ['view', 'apply', 'hire', 'favorite', 'unfavorite', 'search', 'click']
    },
    metadata: {
        timeSpent: { type: Number, default: 0 }, // seconds
        scrollDepth: { type: Number, default: 0 }, // percentage
        searchQuery: { type: String },
        referrer: { type: String },
        deviceType: { type: String, enum: ['desktop', 'mobile', 'tablet'] }
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for better query performance
userInteractionSchema.index({ userId: 1, timestamp: -1 });
userInteractionSchema.index({ itemId: 1, interactionType: 1 });
userInteractionSchema.index({ userId: 1, itemId: 1 });
userInteractionSchema.index({ timestamp: -1 });

// Static method to record interaction
userInteractionSchema.statics.recordInteraction = async function (data) {
    try {
        const interaction = new this(data);
        await interaction.save();
        return interaction;
    } catch (error) {
        console.error('Error recording interaction:', error);
        throw error;
    }
};

// Static method to get user's interaction history
userInteractionSchema.statics.getUserHistory = async function (userId, limit = 100) {
    return this.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('itemId');
};

// Static method to get similar users based on interactions
userInteractionSchema.statics.getSimilarUsers = async function (userId, limit = 10) {
    // Find users who interacted with the same items
    const userInteractions = await this.find({ userId }).distinct('itemId');

    const similarUsers = await this.aggregate([
        {
            $match: {
                itemId: { $in: userInteractions },
                userId: { $ne: userId }
            }
        },
        {
            $group: {
                _id: '$userId',
                commonInteractions: { $sum: 1 }
            }
        },
        {
            $sort: { commonInteractions: -1 }
        },
        {
            $limit: limit
        }
    ]);

    return similarUsers;
};

const UserInteraction = mongoose.model('UserInteraction', userInteractionSchema);

module.exports = UserInteraction;
