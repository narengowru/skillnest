const Proposal = require('../models/Proposal');
const Job = require('../models/Job');
const Freelancer = require('../models/Freelancer');
const Client = require('../models/Client');

// ─── Submit a new proposal ────────────────────────────────────────────────────
exports.createProposal = async (req, res) => {
    try {
        const { projectId, freelancerId, clientId, bidAmount, deliveryTime, proposalText } = req.body;

        // Check for duplicate proposal (same freelancer on same project)
        const existing = await Proposal.findOne({ projectId, freelancerId });
        if (existing) {
            return res.status(400).json({ message: 'You have already submitted a proposal for this project' });
        }

        const proposal = new Proposal({ projectId, freelancerId, clientId, bidAmount, deliveryTime, proposalText });
        await proposal.save();

        // Push the proposal ObjectId into the Job's proposals array
        await Job.findByIdAndUpdate(projectId, { $push: { proposals: proposal._id } });

        res.status(201).json({ message: 'Proposal submitted successfully', proposal });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ─── Get all proposals for a specific job/project ────────────────────────────
exports.getProposalsByJob = async (req, res) => {
    try {
        const proposals = await Proposal.find({ projectId: req.params.jobId })
            .populate('freelancerId', 'name profilePhoto skills hourlyRate')
            .sort({ createdAt: -1 });

        res.status(200).json(proposals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Get all proposals submitted by a freelancer ─────────────────────────────
exports.getProposalsByFreelancer = async (req, res) => {
    try {
        const proposals = await Proposal.find({ freelancerId: req.params.freelancerId })
            .populate('projectId', 'title budget status category')
            .sort({ createdAt: -1 });

        res.status(200).json(proposals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Get all proposals received by a client ──────────────────────────────────
exports.getProposalsByClient = async (req, res) => {
    try {
        const proposals = await Proposal.find({ clientId: req.params.clientId })
            .populate('freelancerId', 'name profilePhoto skills hourlyRate')
            .populate('projectId', 'title budget status category')
            .sort({ createdAt: -1 });

        res.status(200).json(proposals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Get a single proposal by ID ─────────────────────────────────────────────
exports.getProposalById = async (req, res) => {
    try {
        const proposal = await Proposal.findById(req.params.id)
            .populate('freelancerId', 'name profilePicture skills hourlyRate')
            .populate('projectId', 'title budget status category')
            .populate('clientId', 'companyName email');

        if (!proposal) {
            return res.status(404).json({ message: 'Proposal not found' });
        }

        res.status(200).json(proposal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Update proposal status (accept / reject / withdraw) ─────────────────────
exports.updateProposalStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'accepted', 'rejected', 'withdrawn'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const proposal = await Proposal.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!proposal) {
            return res.status(404).json({ message: 'Proposal not found' });
        }

        // If a proposal is accepted, reject all other pending proposals for the same project
        if (status === 'accepted') {
            await Proposal.updateMany(
                { projectId: proposal.projectId, _id: { $ne: proposal._id }, status: 'pending' },
                { status: 'rejected' }
            );

            // Mark the job as in-progress
            await Job.findByIdAndUpdate(proposal.projectId, { status: 'in-progress' });
        }

        res.status(200).json({ message: 'Proposal status updated successfully', proposal });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// ─── Delete / withdraw a proposal ────────────────────────────────────────────
exports.deleteProposal = async (req, res) => {
    try {
        const proposal = await Proposal.findByIdAndDelete(req.params.id);

        if (!proposal) {
            return res.status(404).json({ message: 'Proposal not found' });
        }

        // Remove the reference from the Job's proposals array
        await Job.findByIdAndUpdate(proposal.projectId, { $pull: { proposals: proposal._id } });

        res.status(200).json({ message: 'Proposal deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
