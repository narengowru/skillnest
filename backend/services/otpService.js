const nodemailer = require('nodemailer');

// In-memory OTP store: { email: { otp, expiresAt } }
const otpStore = new Map();

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendOTP = async (email, userType) => {
  const otp = generateOTP();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  otpStore.set(email, { otp, expiresAt });

  const transporter = createTransporter();

  const roleLabel = userType === 'freelancer' ? 'Freelancer' : 'Client';

  const mailOptions = {
    from: `"SkillNest" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your SkillNest OTP Verification Code`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>SkillNest OTP</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#6c63ff,#3ecfcf);padding:36px 40px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">SkillNest</h1>
                    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">${roleLabel} Registration Verification</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <p style="color:#333;font-size:16px;margin:0 0 12px;">Hello,</p>
                    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 28px;">
                      Thank you for registering as a <strong>${roleLabel}</strong> on SkillNest. 
                      Use the OTP below to verify your email address. This code is valid for <strong>10 minutes</strong>.
                    </p>
                    <!-- OTP Box -->
                    <div style="background:#f0f0ff;border:2px dashed #6c63ff;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
                      <p style="color:#6c63ff;font-size:13px;font-weight:600;letter-spacing:2px;margin:0 0 8px;text-transform:uppercase;">Your Verification Code</p>
                      <p style="color:#1a1a2e;font-size:42px;font-weight:800;letter-spacing:10px;margin:0;font-family:monospace;">${otp}</p>
                    </div>
                    <p style="color:#888;font-size:13px;line-height:1.6;margin:0;">
                      If you did not request this, please ignore this email. Do not share this OTP with anyone.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#f9f9ff;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
                    <p style="color:#aaa;font-size:12px;margin:0;">© 2024 SkillNest. All rights reserved.</p>
                    <p style="color:#aaa;font-size:12px;margin:4px 0 0;">Need help? Contact <a href="mailto:admin@skillnest.com" style="color:#6c63ff;text-decoration:none;">admin@skillnest.com</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  return { success: true, message: 'OTP sent successfully' };
};

const verifyOTP = (email, otp) => {
  const record = otpStore.get(email);

  if (!record) {
    return { valid: false, message: 'No OTP found for this email. Please request a new one.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  if (record.otp !== otp) {
    return { valid: false, message: 'Invalid OTP. Please check and try again.' };
  }

  otpStore.delete(email); // Remove after successful verification
  return { valid: true, message: 'OTP verified successfully' };
};

module.exports = { sendOTP, verifyOTP };
