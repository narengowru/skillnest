const Freelancer = require('../models/Freelancer');
const Job = require('../models/Job');
const UserInteraction = require('../models/UserInteraction');

/**
 * Recommendation Service for SkillNest
 * Implements hybrid recommendation algorithm combining:
 * 1. Content-based filtering (TF-IDF + Cosine Similarity)
 * 2. Collaborative filtering (based on application history)
 * 3. Weighted scoring with multiple factors
 */

class RecommendationService {
    constructor() {
        // Cache for TF-IDF calculations
        this.skillIdfCache = null;
        this.cacheTimestamp = null;
        this.CACHE_DURATION = 3600000; // 1 hour in milliseconds
    }

    /**
     * Calculate TF-IDF weights for skills across all jobs
     * TF-IDF = Term Frequency × Inverse Document Frequency
     */
    async calculateSkillIDF() {
        // Check cache
        if (this.skillIdfCache && this.cacheTimestamp &&
            (Date.now() - this.cacheTimestamp < this.CACHE_DURATION)) {
            return this.skillIdfCache;
        }

        const jobs = await Job.find({ status: 'open' });
        const totalJobs = jobs.length;

        if (totalJobs === 0) return {};

        // Count document frequency for each skill
        const skillDocFreq = {};
        jobs.forEach(job => {
            const uniqueSkills = new Set(job.skills?.map(s => s.toLowerCase()) || []);
            uniqueSkills.forEach(skill => {
                skillDocFreq[skill] = (skillDocFreq[skill] || 0) + 1;
            });
        });

        // Calculate IDF: log(total_docs / doc_freq)
        const skillIdf = {};
        Object.keys(skillDocFreq).forEach(skill => {
            skillIdf[skill] = Math.log(totalJobs / skillDocFreq[skill]);
        });

        // Update cache
        this.skillIdfCache = skillIdf;
        this.cacheTimestamp = Date.now();

        return skillIdf;
    }

    /**
     * Create TF-IDF weighted skill vector
     */
    async createSkillVector(skills, skillLevels = null) {
        const skillIdf = await this.calculateSkillIDF();
        const vector = {};

        skills.forEach((skill, index) => {
            const skillLower = skill.toLowerCase();
            const tf = 1; // Term frequency (1 for presence)
            const idf = skillIdf[skillLower] || 0;
            const level = skillLevels ? (skillLevels[index] / 100) : 1; // Normalize to 0-1

            vector[skillLower] = tf * idf * level;
        });

        return vector;
    }

    /**
     * Calculate cosine similarity between two vectors
     * similarity = (A · B) / (||A|| × ||B||)
     */
    cosineSimilarity(vectorA, vectorB) {
        const allSkills = new Set([...Object.keys(vectorA), ...Object.keys(vectorB)]);

        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;

        allSkills.forEach(skill => {
            const a = vectorA[skill] || 0;
            const b = vectorB[skill] || 0;

            dotProduct += a * b;
            magnitudeA += a * a;
            magnitudeB += b * b;
        });

        magnitudeA = Math.sqrt(magnitudeA);
        magnitudeB = Math.sqrt(magnitudeB);

        if (magnitudeA === 0 || magnitudeB === 0) return 0;

        return dotProduct / (magnitudeA * magnitudeB);
    }

    /**
     * Calculate skill match score between freelancer and job
     */
    async calculateSkillMatchScore(freelancer, job) {
        if (!freelancer.skills || freelancer.skills.length === 0) return 0;
        if (!job.skills || job.skills.length === 0) return 0;

        const freelancerSkills = freelancer.skills.map(s => s.name);
        const freelancerLevels = freelancer.skills.map(s => s.level);
        const jobSkills = job.skills;

        const freelancerVector = await this.createSkillVector(freelancerSkills, freelancerLevels);
        const jobVector = await this.createSkillVector(jobSkills);

        return this.cosineSimilarity(freelancerVector, jobVector);
    }

    /**
     * Calculate collaborative filtering score based on application history
     * Uses item-based collaborative filtering
     */
    async calculateCollaborativeScore(freelancerId, jobId) {
        try {
            // Get freelancer's application history
            const freelancer = await Freelancer.findById(freelancerId).select('applications');
            if (!freelancer || !freelancer.applications || freelancer.applications.length === 0) {
                return 0.5; // Neutral score for new users
            }

            const appliedJobIds = freelancer.applications.map(app => app.jobId);

            // Find similar users who applied to the same jobs
            const similarUsers = await Freelancer.find({
                'applications.jobId': { $in: appliedJobIds },
                _id: { $ne: freelancerId }
            }).select('applications');

            if (similarUsers.length === 0) return 0.5;

            // Count how many similar users applied to the target job
            let targetJobApplications = 0;
            let totalSimilarUsers = similarUsers.length;

            similarUsers.forEach(user => {
                const hasApplied = user.applications.some(
                    app => app.jobId.toString() === jobId.toString()
                );
                if (hasApplied) targetJobApplications++;
            });

            // Score based on percentage of similar users who applied
            return targetJobApplications / totalSimilarUsers;
        } catch (error) {
            console.error('Error calculating collaborative score:', error);
            return 0.5;
        }
    }

    /**
     * Calculate rating score (normalized 0-1)
     */
    calculateRatingScore(freelancer) {
        if (!freelancer.ratings || !freelancer.ratings.average) return 0.5;
        return freelancer.ratings.average / 5.0;
    }

    /**
     * Calculate success rate score
     */
    calculateSuccessRateScore(freelancer) {
        const completed = freelancer.jobsCompleted || 0;
        const total = freelancer.applications?.length || 0;

        if (total === 0) return 0.5; // Neutral for new freelancers
        return Math.min(completed / total, 1.0);
    }

    /**
     * Calculate recency score (exponential decay)
     * Prefers freelancers who have been active recently
     */
    calculateRecencyScore(freelancer) {
        const lastActive = freelancer.statistics?.lastActiveDate || freelancer.updatedAt || new Date();
        const daysSinceActive = (Date.now() - new Date(lastActive)) / (1000 * 60 * 60 * 24);

        // Exponential decay with 30-day half-life
        return Math.exp(-daysSinceActive / 30);
    }

    /**
     * Calculate budget match score (Gaussian distribution)
     */
    calculateBudgetMatchScore(freelancer, job) {
        if (!job.budget || !freelancer.hourlyRate) return 0.5;

        // Extract numeric values from budget strings
        const jobBudget = this.extractBudgetValue(job.budget);
        const freelancerRate = this.extractBudgetValue(freelancer.hourlyRate);

        if (jobBudget === 0 || freelancerRate === 0) return 0.5;

        // Gaussian distribution: exp(-((x - μ)^2) / (2σ^2))
        const sigma = freelancerRate * 0.3; // 30% standard deviation
        const diff = jobBudget - freelancerRate;

        return Math.exp(-(diff * diff) / (2 * sigma * sigma));
    }

    /**
     * Extract numeric value from budget string
     */
    extractBudgetValue(budgetStr) {
        if (typeof budgetStr === 'number') return budgetStr;
        if (!budgetStr) return 0;

        // Extract first number from string like "$500-$1000" or "$50/hr"
        const match = budgetStr.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
    }

    /**
     * Calculate category match score
     */
    calculateCategoryScore(freelancer, job) {
        // Check if freelancer has worked in this category before
        const preferredCategories = freelancer.preferences?.preferredCategories || [];

        if (preferredCategories.includes(job.category)) {
            return 1.0; // Perfect match
        }

        // Related categories (can be expanded)
        const relatedCategories = {
            'Programming & Development': ['Design & Art'],
            'Design & Art': ['Programming & Development'],
            'Writing & Translation': ['Administrative & Secretarial'],
            'Administrative & Secretarial': ['Writing & Translation'],
            'Business & Finance': ['Sales & Marketing'],
            'Sales & Marketing': ['Business & Finance']
        };

        const related = relatedCategories[job.category] || [];
        const hasRelated = preferredCategories.some(cat => related.includes(cat));

        return hasRelated ? 0.5 : 0.3; // Partial match or neutral
    }

    /**
     * Main hybrid scoring function
     * Combines all factors with optimized weights
     */
    async calculateHybridScore(freelancer, job) {
        // Weights (must sum to 1.0)
        const weights = {
            skillMatch: 0.35,      // Most important
            collaborative: 0.20,   // User behavior patterns
            rating: 0.15,          // Freelancer quality
            successRate: 0.15,     // Track record
            recency: 0.10,         // Recent activity
            budget: 0.05           // Budget compatibility
        };

        // Calculate individual scores
        const scores = {
            skillMatch: await this.calculateSkillMatchScore(freelancer, job),
            collaborative: await this.calculateCollaborativeScore(freelancer._id, job._id),
            rating: this.calculateRatingScore(freelancer),
            successRate: this.calculateSuccessRateScore(freelancer),
            recency: this.calculateRecencyScore(freelancer),
            budget: this.calculateBudgetMatchScore(freelancer, job)
        };

        // Calculate weighted sum
        let finalScore = 0;
        Object.keys(weights).forEach(key => {
            finalScore += weights[key] * scores[key];
        });

        return {
            finalScore: Math.round(finalScore * 100), // Convert to percentage
            breakdown: scores,
            weights
        };
    }

    /**
     * Generate match reasons for display
     */
    generateMatchReasons(scores, freelancer, job) {
        const reasons = [];

        // Skill match
        if (scores.skillMatch > 0.7) {
            reasons.push(`${Math.round(scores.skillMatch * 100)}% skill match`);
        } else if (scores.skillMatch > 0.4) {
            reasons.push(`${Math.round(scores.skillMatch * 100)}% skill match - some skills align`);
        }

        // Rating
        if (scores.rating > 0.8) {
            reasons.push(`Highly rated (${freelancer.ratings?.average || 'N/A'}/5.0)`);
        }

        // Success rate
        if (scores.successRate > 0.8) {
            reasons.push(`${Math.round(scores.successRate * 100)}% success rate`);
        }

        // Budget
        if (scores.budget > 0.7) {
            reasons.push('Budget matches your rate');
        }

        // Collaborative
        if (scores.collaborative > 0.6) {
            reasons.push('Similar freelancers applied to this job');
        }

        // Category
        const preferredCategories = freelancer.preferences?.preferredCategories || [];
        if (preferredCategories.includes(job.category)) {
            reasons.push('Matches your preferred category');
        }

        // Default reason if no specific matches
        if (reasons.length === 0) {
            reasons.push('New opportunity in your field');
        }

        return reasons.slice(0, 3); // Return top 3 reasons
    }

    /**
     * Get job recommendations for a freelancer
     */
    async getJobRecommendations(freelancerId, options = {}) {
        const {
            limit = 20,
            excludeApplied = true,
            minScore = 30 // Minimum match score (0-100)
        } = options;

        try {
            // Get freelancer data
            const freelancer = await Freelancer.findById(freelancerId);
            if (!freelancer) {
                throw new Error('Freelancer not found');
            }

            // Get all open jobs
            let jobQuery = { status: 'open' };

            // Exclude jobs already applied to
            if (excludeApplied && freelancer.applications && freelancer.applications.length > 0) {
                const appliedJobIds = freelancer.applications.map(app => app.jobId);
                jobQuery._id = { $nin: appliedJobIds };
            }

            const jobs = await Job.find(jobQuery).populate('client');

            // Calculate scores for all jobs
            const scoredJobs = await Promise.all(
                jobs.map(async (job) => {
                    const scoreData = await this.calculateHybridScore(freelancer, job);
                    const reasons = this.generateMatchReasons(scoreData.breakdown, freelancer, job);

                    return {
                        job: job.toObject(),
                        matchScore: scoreData.finalScore,
                        matchReasons: reasons,
                        scoreBreakdown: scoreData.breakdown
                    };
                })
            );

            // Filter by minimum score and sort by score
            const recommendations = scoredJobs
                .filter(item => item.matchScore >= minScore)
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, limit);

            return {
                recommendations,
                total: recommendations.length,
                freelancerId
            };
        } catch (error) {
            console.error('Error generating recommendations:', error);
            throw error;
        }
    }

    /**
     * Record job view interaction
     */
    async recordJobView(freelancerId, jobId, metadata = {}) {
        try {
            await UserInteraction.recordInteraction({
                userId: freelancerId,
                userModel: 'Freelancer',
                itemId: jobId,
                itemModel: 'Job',
                interactionType: 'view',
                metadata
            });

            // Update freelancer's last active date
            await Freelancer.findByIdAndUpdate(freelancerId, {
                'statistics.lastActiveDate': new Date()
            });
        } catch (error) {
            console.error('Error recording job view:', error);
        }
    }

    /**
     * Clear cache (useful for testing or manual refresh)
     */
    clearCache() {
        this.skillIdfCache = null;
        this.cacheTimestamp = null;
    }

    /**
     * ========================================
     * FREELANCER RECOMMENDATION METHODS FOR CLIENTS
     * ========================================
     */

    /**
     * Calculate skill match score between client's job requirements and freelancer skills
     * Uses TF-IDF weighted cosine similarity
     */
    async calculateFreelancerSkillMatchScore(freelancer, clientJobs) {
        if (!freelancer.skills || freelancer.skills.length === 0) return 0;
        if (!clientJobs || clientJobs.length === 0) return 0.5; // Neutral for clients with no jobs

        // Extract all skills from client's jobs
        const jobSkills = [];
        clientJobs.forEach(job => {
            if (job.skills && Array.isArray(job.skills)) {
                jobSkills.push(...job.skills);
            }
        });

        if (jobSkills.length === 0) return 0.5;

        // Create skill vectors
        const freelancerSkills = freelancer.skills.map(s => s.name);
        const freelancerLevels = freelancer.skills.map(s => s.level);

        const freelancerVector = await this.createSkillVector(freelancerSkills, freelancerLevels);
        const clientVector = await this.createSkillVector(jobSkills);

        return this.cosineSimilarity(freelancerVector, clientVector);
    }

    /**
     * Calculate collaborative filtering score for freelancer recommendations
     * Based on which freelancers the client has worked with before
     */
    async calculateClientCollaborativeScore(clientId, freelancerId, clientJobs) {
        try {
            const Client = require('../models/Client');

            // Check if client has worked with this freelancer before
            const workedTogetherCount = clientJobs.filter(job => {
                if (!job.applications || !Array.isArray(job.applications)) return false;
                return job.applications.some(app =>
                    app.freelancerId &&
                    app.freelancerId.toString() === freelancerId.toString() &&
                    app.status === 'accepted'
                );
            }).length;

            // Boost score if they've worked together successfully
            if (workedTogetherCount > 0) {
                return Math.min(0.7 + (workedTogetherCount * 0.1), 1.0);
            }

            // Find similar clients (those who posted similar jobs)
            const jobSkills = new Set();
            clientJobs.forEach(job => {
                if (job.skills && Array.isArray(job.skills)) {
                    job.skills.forEach(skill => jobSkills.add(skill.toLowerCase()));
                }
            });

            if (jobSkills.size === 0) return 0.5;

            // Find other jobs with similar skills
            const similarJobs = await Job.find({
                'client._id': { $ne: clientId },
                skills: { $in: Array.from(jobSkills) },
                status: { $in: ['completed', 'in-progress'] }
            }).select('applications');

            if (similarJobs.length === 0) return 0.5;

            // Count how many times this freelancer was hired for similar jobs
            let hiredCount = 0;
            let totalSimilarJobs = similarJobs.length;

            similarJobs.forEach(job => {
                if (job.applications && Array.isArray(job.applications)) {
                    const wasHired = job.applications.some(app =>
                        app.freelancerId &&
                        app.freelancerId.toString() === freelancerId.toString() &&
                        app.status === 'accepted'
                    );
                    if (wasHired) hiredCount++;
                }
            });

            return hiredCount / totalSimilarJobs;
        } catch (error) {
            console.error('Error calculating client collaborative score:', error);
            return 0.5;
        }
    }

    /**
     * Calculate freelancer quality score
     */
    calculateFreelancerQualityScore(freelancer) {
        const ratingScore = this.calculateRatingScore(freelancer);
        const successScore = this.calculateSuccessRateScore(freelancer);
        const recencyScore = this.calculateRecencyScore(freelancer);

        // Weighted average
        return (ratingScore * 0.4) + (successScore * 0.4) + (recencyScore * 0.2);
    }

    /**
     * Calculate experience match score
     * Considers jobs completed and years of experience
     */
    calculateExperienceScore(freelancer, clientJobs) {
        const jobsCompleted = freelancer.jobsCompleted || 0;

        // Calculate average complexity of client's jobs
        const avgJobComplexity = clientJobs.length > 0 ?
            clientJobs.reduce((sum, job) => {
                // Estimate complexity based on skills required
                const skillCount = job.skills ? job.skills.length : 0;
                return sum + skillCount;
            }, 0) / clientJobs.length : 5;

        // Match freelancer experience to job complexity
        if (jobsCompleted === 0) return 0.3; // New freelancers
        if (jobsCompleted < 5) return avgJobComplexity <= 3 ? 0.7 : 0.4; // Beginners
        if (jobsCompleted < 20) return avgJobComplexity <= 6 ? 0.8 : 0.6; // Intermediate
        return 0.9; // Experienced freelancers
    }

    /**
     * Calculate category match score for freelancers
     */
    calculateFreelancerCategoryScore(freelancer, clientJobs) {
        if (!clientJobs || clientJobs.length === 0) return 0.5;

        const clientCategories = new Set(
            clientJobs.map(job => job.category).filter(Boolean)
        );

        if (clientCategories.size === 0) return 0.5;

        const freelancerCategories = freelancer.preferences?.preferredCategories || [];

        // Check for exact matches
        let matchCount = 0;
        clientCategories.forEach(category => {
            if (freelancerCategories.includes(category)) {
                matchCount++;
            }
        });

        if (matchCount > 0) {
            return Math.min(0.7 + (matchCount * 0.15), 1.0);
        }

        return 0.4; // Neutral if no category match
    }

    /**
     * Main hybrid scoring function for freelancer recommendations
     */
    async calculateFreelancerHybridScore(freelancer, clientId, clientJobs) {
        // Weights (must sum to 1.0)
        const weights = {
            skillMatch: 0.35,       // Most important - skill alignment
            collaborative: 0.20,    // Past working relationships
            quality: 0.20,          // Freelancer ratings and success
            experience: 0.15,       // Experience level match
            category: 0.10          // Category preference
        };

        // Calculate individual scores
        const scores = {
            skillMatch: await this.calculateFreelancerSkillMatchScore(freelancer, clientJobs),
            collaborative: await this.calculateClientCollaborativeScore(clientId, freelancer._id, clientJobs),
            quality: this.calculateFreelancerQualityScore(freelancer),
            experience: this.calculateExperienceScore(freelancer, clientJobs),
            category: this.calculateFreelancerCategoryScore(freelancer, clientJobs)
        };

        // Calculate weighted sum
        let finalScore = 0;
        Object.keys(weights).forEach(key => {
            finalScore += weights[key] * scores[key];
        });

        return {
            finalScore: Math.round(finalScore * 100), // Convert to percentage
            breakdown: scores,
            weights
        };
    }

    /**
     * Generate match reasons for freelancer recommendations
     */
    generateFreelancerMatchReasons(scores, freelancer, clientJobs) {
        const reasons = [];

        // Skill match
        if (scores.skillMatch > 0.7) {
            reasons.push(`${Math.round(scores.skillMatch * 100)}% skill match with your job requirements`);
        } else if (scores.skillMatch > 0.4) {
            reasons.push(`${Math.round(scores.skillMatch * 100)}% skill alignment`);
        }

        // Quality/Rating
        if (scores.quality > 0.8 && freelancer.ratings?.average) {
            reasons.push(`Highly rated (${freelancer.ratings.average}/5.0)`);
        }

        // Experience
        if (freelancer.jobsCompleted > 20) {
            reasons.push(`Experienced with ${freelancer.jobsCompleted}+ completed projects`);
        } else if (freelancer.jobsCompleted > 5) {
            reasons.push(`${freelancer.jobsCompleted} completed projects`);
        }

        // Collaborative - worked together before
        if (scores.collaborative > 0.7) {
            reasons.push('You\'ve worked together successfully before');
        } else if (scores.collaborative > 0.5) {
            reasons.push('Hired by clients with similar needs');
        }

        // Category match
        const clientCategories = new Set(
            clientJobs.map(job => job.category).filter(Boolean)
        );
        const freelancerCategories = freelancer.preferences?.preferredCategories || [];
        const matchingCategories = [...clientCategories].filter(cat =>
            freelancerCategories.includes(cat)
        );
        if (matchingCategories.length > 0) {
            reasons.push(`Specializes in ${matchingCategories[0]}`);
        }

        // Default reason if no specific matches
        if (reasons.length === 0) {
            reasons.push('Available freelancer matching your criteria');
        }

        return reasons.slice(0, 3); // Return top 3 reasons
    }

    /**
     * Get freelancer recommendations for a client
     */
    async getFreelancerRecommendations(clientId, options = {}) {
        const {
            limit = 20,
            minScore = 50 // Minimum match s    core (0-100)
        } = options;

        try {
            const Client = require('../models/Client');

            // Get client data
            const client = await Client.findById(clientId);
            if (!client) {
                throw new Error('Client not found');
            }

            // Get all jobs posted by this client
            const clientJobs = await Job.find({
                $or: [
                    { 'client._id': clientId },
                    { clientId: clientId }
                ]
            }).select('skills category description applications status');

            // Get all verified freelancers
            const freelancers = await Freelancer.find({
                isVerified: true
            });

            // Calculate scores for all freelancers
            const scoredFreelancers = await Promise.all(
                freelancers.map(async (freelancer) => {
                    const scoreData = await this.calculateFreelancerHybridScore(
                        freelancer,
                        clientId,
                        clientJobs
                    );
                    const reasons = this.generateFreelancerMatchReasons(
                        scoreData.breakdown,
                        freelancer,
                        clientJobs
                    );

                    return {
                        freelancer: freelancer.toObject(),
                        matchScore: scoreData.finalScore,
                        matchReasons: reasons,
                        scoreBreakdown: scoreData.breakdown
                    };
                })
            );

            // Filter by minimum score and sort by score
            const recommendations = scoredFreelancers
                .filter(item => item.matchScore >= minScore)
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, limit);

            return {
                recommendations,
                total: recommendations.length,
                clientId
            };
        } catch (error) {
            console.error('Error generating freelancer recommendations:', error);
            throw error;
        }
    }
}

// Export singleton instance
module.exports = new RecommendationService();
