const nodemailer = require("nodemailer");

const emailUser = process.env.EMAIL_USER || "";
const emailPass = process.env.EMAIL_PASS || "";
const isConfigured =
  emailUser &&
  emailPass &&
  !emailUser.includes("your_gmail") &&
  !emailPass.includes("your_gmail");

if (!isConfigured) {
  console.warn(
    "Gmail SMTP is not configured. Set EMAIL_USER and EMAIL_PASS in backend/.env with a real Gmail app password."
  );
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

module.exports = transporter;