const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const Freelancer = require('../models/Freelancer');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * POST /api/generate-proposal
 * Body: { freelancerId, project: { title, description, skills, budget, category, experienceLevel, projectDuration } }
 * Returns: { proposal: "..." }
 */
router.post('/', async (req, res) => {
  const { freelancerId, project } = req.body;

  if (!freelancerId || !project) {
    return res.status(400).json({ success: false, message: 'freelancerId and project are required.' });
  }

  try {
    // Fetch full freelancer profile from DB
    const freelancer = await Freelancer.findById(freelancerId).select(
      'name tagline bio skills hourlyRate jobsCompleted ratings location previousWork'
    );

    if (!freelancer) {
      return res.status(404).json({ success: false, message: 'Freelancer not found.' });
    }

    // ── Find COMMON skills between project and freelancer ──────────────────
    const projectSkillsLower = (project.skills || []).map(s => s.toLowerCase().trim());
    const freelancerSkills = freelancer.skills || [];

    const matchingSkills = freelancerSkills
      .filter(s => projectSkillsLower.includes(s.name?.toLowerCase().trim()))
      .map(s => `${s.name} (${s.level}% proficiency)`);

    const otherSkills = freelancerSkills
      .filter(s => !projectSkillsLower.includes(s.name?.toLowerCase().trim()))
      .slice(0, 3)
      .map(s => s.name);

    // ── Previous work ──────────────────────────────────────────────────────
    const prevWork = (freelancer.previousWork || []).slice(0, 2);
    const prevWorkSection = prevWork.length > 0
      ? prevWork.map(w => `- "${w.title}": ${w.description?.slice(0, 100) || 'Completed successfully'}`).join('\n')
      : 'No previous work listed';

    // ── Build the prompt ───────────────────────────────────────────────────
    const systemPrompt = `You are a professional freelance proposal writer for SkillNest.
Write a concise, compelling proposal cover letter that:
- Is 100–130 words long (this is non-negotiable)
- Starts by directly referencing the project by name
- Highlights the MATCHING skills between the freelancer and the project first
- Mentions 1 relevant previous project by name if available
- Ends with a confident, one-sentence call to action
- Writes in first person (as the freelancer)
- Has NO subject line, NO "Dear", NO sign-off — just the body
- Sounds natural and human, not robotic or template-like`;

    const userPrompt = `Generate a proposal cover letter for this freelancer applying to this project.

PROJECT: "${project.title}"
Description: ${project.description?.slice(0, 300)}
Required Skills: ${(project.skills || []).join(', ') || 'Not specified'}
Budget: ${project.budget || 'open'}
Duration: ${project.projectDuration || 'flexible'}

FREELANCER: ${freelancer.name}
${matchingSkills.length > 0
  ? `MATCHING Skills (freelancer has these AND the project needs them): ${matchingSkills.join(', ')}`
  : `Freelancer Skills: ${otherSkills.join(', ') || 'General skills'}`
}
Other Skills: ${otherSkills.join(', ') || 'None'}
Jobs Completed: ${freelancer.jobsCompleted || 0}
Rating: ${freelancer.ratings?.average || 'New'}/5
Previous Work:
${prevWorkSection}

Tagline: ${freelancer.tagline || ''}

Write the proposal now (100-130 words, no fluff):`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.65,
      max_tokens: 220, // 220 tokens ≈ 130–160 words — gives a little headroom
    });

    const proposal = chatCompletion.choices[0]?.message?.content?.trim();

    if (!proposal) {
      return res.status(500).json({ success: false, message: 'AI did not return a proposal.' });
    }

    res.json({ success: true, proposal });

  } catch (error) {
    console.error('Error generating AI proposal:', error);
    res.status(500).json({ success: false, message: 'Failed to generate proposal. Please try again.' });
  }
});

module.exports = router;
