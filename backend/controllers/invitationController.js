const Invitation = require('../models/Invitation');
const Freelancer = require('../models/Freelancer');

// ─── Send a new invitation (client → freelancer) ──────────────────────────────
exports.sendInvitation = async (req, res) => {
    try {
        const {
            clientId,
            freelancerId,
            projectTitle,
            description,
            budgetType,
            budgetAmount,
            deadline,
            message,
        } = req.body;

        // Prevent duplicate pending invitations from same client to same freelancer
        const existing = await Invitation.findOne({
            clientId,
            freelancerId,
            status: 'pending',
        });
        if (existing) {
            return res.status(400).json({
                message: 'You already have a pending invitation for this freelancer.',
            });
        }

        const invitation = new Invitation({
            clientId,
            freelancerId,
            projectTitle,
            description,
            budgetType,
            budgetAmount,
            deadline,
            message: message || '',
        });

        await invitation.save();

        // Keep freelancer's invitations array in sync
        await Freelancer.findByIdAndUpdate(
            freelancerId,
            { $push: { invitations: invitation._id } }
        );

        res.status(201).json({
            message: 'Invitation sent successfully',
            invitation,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ─── Get all invitations sent by a client ─────────────────────────────────────
exports.getInvitationsByClient = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { status } = req.query; // optional filter: ?status=pending

        const filter = { clientId };
        if (status) filter.status = status;

        const invitations = await Invitation.find(filter)
            .populate('freelancerId', 'name profilePhoto skills hourlyRate tagline')
            .sort({ createdAt: -1 });

        res.status(200).json(invitations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Get all invitations received by a freelancer ────────────────────────────
exports.getInvitationsByFreelancer = async (req, res) => {
    try {
        const { freelancerId } = req.params;
        const { status } = req.query; // optional filter: ?status=pending

        const filter = { freelancerId };
        if (status) filter.status = status;

        const invitations = await Invitation.find(filter)
            .populate('clientId', 'companyName profilePicture location')
            .sort({ createdAt: -1 });

        res.status(200).json(invitations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Get a single invitation by ID ───────────────────────────────────────────
exports.getInvitationById = async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.id)
            .populate('clientId', 'companyName profilePicture location')
            .populate('freelancerId', 'name profilePhoto skills hourlyRate tagline');

        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        res.status(200).json(invitation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Update invitation status (accept / decline / expire) ────────────────────
exports.updateInvitationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ['accepted', 'declined', 'expired'];

        if (!allowed.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Must be one of: ${allowed.join(', ')}`,
            });
        }

        const invitation = await Invitation.findById(req.params.id);
        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({
                message: `Cannot update an invitation that is already '${invitation.status}'.`,
            });
        }

        invitation.status = status;
        await invitation.save();

        res.status(200).json({
            message: `Invitation ${status} successfully`,
            invitation,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ─── Delete / withdraw an invitation (client only) ───────────────────────────
exports.deleteInvitation = async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.id);
        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({
                message: 'Only pending invitations can be withdrawn.',
            });
        }

        await Invitation.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Invitation withdrawn successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
