const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP } = require('../services/otpService');

// POST /api/otp/send
// Body: { email, userType }
router.post('/send', async (req, res) => {
  const { email, userType } = req.body;

  if (!email || !userType) {
    return res.status(400).json({ success: false, message: 'Email and userType are required.' });
  }

  try {
    const result = await sendOTP(email, userType);
    res.json(result);
  } catch (error) {
    console.error('OTP send error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
  }
});

// POST /api/otp/verify
// Body: { email, otp }
router.post('/verify', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ valid: false, message: 'Email and OTP are required.' });
  }

  const result = verifyOTP(email, otp);
  if (result.valid) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

module.exports = router;
