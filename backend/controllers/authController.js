const bcrypt = require("bcryptjs");
const transporter = require("../config/email");
const { User, Otp, PasswordResetOtp } = require("../models");
const { success, error } = require("../utils/response");
const { isNonEmptyString, isValidEmail, isValidRole } = require("../utils/validators");
const { normalizePhoneNumber, isValidPhoneNumber } = require("../utils/phone");

function sanitizeUser(user) {
  const { id, name, email, phone, role, address, city, state, pincode } = user;
  return { id, name, email, phone, role, address, city, state, pincode };
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function register(req, res, next) {
  try {
    const { name, email, password, phone, role, address, city, state, pincode } = req.body;

    if (!isNonEmptyString(name)) return error(res, 400, "Name is required");
    if (!isValidEmail(email)) return error(res, 400, "A valid email is required");
    if (!isNonEmptyString(password) || password.length < 6)
      return error(res, 400, "Password must be at least 6 characters");
    if (!isNonEmptyString(phone) || !isValidPhoneNumber(phone)) {
      return error(res, 400, "Enter a valid WhatsApp number with country code, for example 919876543210");
    }
    if (!isValidRole(role)) return error(res, 400, "Role must be 'farmer' or 'customer'");

    const normalizedPhone = normalizePhoneNumber(phone);

    const existing = await User.findOne({ where: { email } });
    if (existing) return error(res, 400, "An account with this email already exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = generateOtp();

    await Otp.destroy({ where: { email } });

    await Otp.create({
      email,
      otp: otpCode,
      name,
      password: hashedPassword,
      phone: normalizedPhone,
      role,
      address: address || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      expiresAt: new Date(Date.now() + 60 * 1000),
    });

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your Rice Marketplace OTP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
            <h2 style="color: #166534;">Verify your email</h2>
            <p>Hello,</p>
            <p>Your OTP for Rice Marketplace registration is:</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #166534;">${otpCode}</p>
            <p>This code expires in 60 seconds.</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error("OTP email failed:", mailErr.message);
      return error(
        res,
        400,
        "Gmail verification is not configured correctly. Use a valid Gmail app password in backend/.env."
      );
    }

    const payload = { email };
    if (process.env.NODE_ENV !== "production") payload.otp = otpCode;

    return success(res, 200, "OTP sent to your email. Please verify to complete registration.", payload);
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;

    if (!isValidEmail(email) || !isNonEmptyString(otp)) {
      return error(res, 400, "Email and OTP are required");
    }

    const otpEntry = await Otp.findOne({ where: { email } });
    if (!otpEntry) return error(res, 400, "No OTP found for this email. Please request a new one.");

    if (new Date(otpEntry.expiresAt) < new Date()) {
      await otpEntry.destroy();
      return error(res, 400, "OTP has expired. Please request a new one.");
    }

    if (otpEntry.otp !== String(otp).trim()) {
      return error(res, 400, "Invalid OTP");
    }

    const user = await User.create({
      name: otpEntry.name,
      email: otpEntry.email,
      password: otpEntry.password,
      phone: normalizePhoneNumber(otpEntry.phone),
      role: otpEntry.role,
      address: otpEntry.address,
      city: otpEntry.city,
      state: otpEntry.state,
      pincode: otpEntry.pincode,
    });

    await otpEntry.destroy();

    return success(res, 201, "Registration successful", {
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!isValidEmail(email) || !isNonEmptyString(password)) {
      return error(res, 400, "Email and password are required");
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return error(res, 401, "Invalid email or password");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return error(res, 401, "Invalid email or password");

    return success(res, 200, "Login successful", {
      user: sanitizeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

async function requestPasswordReset(req, res, next) {
  try {
    const { email } = req.body;

    if (!isValidEmail(email)) return error(res, 400, "A valid email is required");

    const user = await User.findOne({ where: { email } });
    if (!user) return error(res, 404, "No account found with this email");

    const otpCode = generateOtp();
    await PasswordResetOtp.destroy({ where: { email } });
    await PasswordResetOtp.create({
      email,
      otp: otpCode,
      expiresAt: new Date(Date.now() + 60 * 1000),
    });

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Reset your Rice Marketplace password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
            <h2 style="color: #166534;">Reset your password</h2>
            <p>Your Rice Marketplace verification code is:</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #166534;">${otpCode}</p>
            <p>This code expires in 1 minute.</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error("Password reset email failed:", mailErr.message);
      await PasswordResetOtp.destroy({ where: { email } });
      return error(res, 400, "Gmail verification is not configured correctly.");
    }

    const payload = { email };
    if (process.env.NODE_ENV !== "production") payload.otp = otpCode;
    return success(res, 200, "Verification code sent to your email.", payload);
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, otp, password } = req.body;

    if (!isValidEmail(email) || !isNonEmptyString(otp)) {
      return error(res, 400, "Email and verification code are required");
    }
    if (!isNonEmptyString(password) || password.length < 6) {
      return error(res, 400, "Password must be at least 6 characters");
    }

    const otpEntry = await PasswordResetOtp.findOne({ where: { email } });
    if (!otpEntry) return error(res, 400, "Verification code not found. Please request a new one.");

    if (new Date(otpEntry.expiresAt) < new Date()) {
      await otpEntry.destroy();
      return error(res, 400, "Verification code expired. Please request a new one.");
    }

    if (otpEntry.otp !== String(otp).trim()) {
      return error(res, 400, "Invalid verification code");
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      await otpEntry.destroy();
      return error(res, 404, "No account found with this email");
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();
    await otpEntry.destroy();

    return success(res, 200, "Password reset successfully", null);
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    return success(res, 200, "Current user fetched", sanitizeUser(req.user));
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  return success(res, 200, "Logout successful", null);
}

module.exports = {
  register,
  verifyOtp,
  login,
  requestPasswordReset,
  resetPassword,
  getMe,
  logout,
  sanitizeUser,
};
