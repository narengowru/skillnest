const Job = require('../models/Job');

// Get all jobs
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find();
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific job
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new job
exports.createJob = async (req, res) => {
  try {
    const job = new Job(req.body);
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a job
exports.updateJob = async (req, res) => {
  try {
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedJob) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.status(200).json(updatedJob);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a job
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Apply to a job
exports.applyToJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    const { freelancerId, coverLetter, proposedRate } = req.body;
    
    // Check if freelancer already applied
    const alreadyApplied = job.applications.some(
      app => app.freelancerId.toString() === freelancerId
    );
    
    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }
    
    job.applications.push({
      freelancerId,
      coverLetter,
      proposedRate
    });
    
    await job.save();
    
    res.status(201).json({
      message: 'Application submitted successfully',
      job
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update application status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { jobId, applicationId } = req.params;
    const { status } = req.body;
    
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    const applicationIndex = job.applications.findIndex(
      app => app._id.toString() === applicationId
    );
    
    if (applicationIndex === -1) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    job.applications[applicationIndex].status = status;
    
    // If accepting this application, update job status
    if (status === 'accepted') {
      job.status = 'in-progress';
      
      // Reject all other applications
      job.applications.forEach((app, index) => {
        if (index !== applicationIndex && app.status === 'pending') {
          app.status = 'rejected';
        }
      });
    }
    
    await job.save();
    
    res.status(200).json({
      message: 'Application status updated successfully',
      job
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};