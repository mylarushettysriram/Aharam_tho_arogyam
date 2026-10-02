require("dotenv").config();

function normalizePhoneNumber(phoneNumber) {
  const digits = String(phoneNumber || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `${process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91"}${digits}`;
  if (digits.startsWith("00")) return digits.slice(2);
  return digits;
}

function isValidPhoneNumber(phoneNumber) {
  const normalized = normalizePhoneNumber(phoneNumber);
  return normalized.length >= 11 && normalized.length <= 15;
}

module.exports = { normalizePhoneNumber, isValidPhoneNumber };