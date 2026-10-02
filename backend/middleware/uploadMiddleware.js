const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { MAX_IMAGE_SIZE_MB } = require("../utils/constants");

const uploadDir = path.join(__dirname, "..", "uploads", "rice");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `rice-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const allowedTypes = [".jpg", ".jpeg", ".png", ".webp"];

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedTypes.includes(ext)) {
    return cb(new Error("Only .jpg, .jpeg, .png and .webp images are allowed"));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE_MB * 1024 * 1024 },
});

module.exports = upload;
