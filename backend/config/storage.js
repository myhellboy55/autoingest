import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get upload destination from environment or use default
const getUploadDestination = () => {
  const dest = process.env.UPLOAD_DESTINATION_PATH || '/uploads/photos';
  // Ensure directory exists
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  return dest;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = getUploadDestination();
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Preserve original filename with timestamp prefix
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${timestamp}-${name}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept common image and video formats
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'application/octet-stream' // RAW files
  ];
  
  if (allowedMimes.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.raw')) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB default
  }
});

export const getDestinationPath = getUploadDestination;
