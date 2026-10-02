// Very small, dependency-free validation helpers.
// Backend never trusts the frontend, so every write endpoint runs these.

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveNumber(value) {
  const n = Number(value);
  return !Number.isNaN(n) && n > 0;
}

function isPositiveInteger(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

function isValidEmail(value) {
  return typeof value === "string" && /^\S+@\S+\.\S+$/.test(value);
}

function isValidRole(value) {
  return value === "farmer" || value === "customer";
}

module.exports = {
  isNonEmptyString,
  isPositiveNumber,
  isPositiveInteger,
  isValidEmail,
  isValidRole,
};
