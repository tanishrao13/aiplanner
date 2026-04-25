import multer from 'multer';
import path from 'path';

// Multer config for file uploads
const storage = multer.memoryStorage(); // store file in memory so we can parse it easily

const fileFilter = (req, file, cb) => {
  const filetypes = /pdf|txt/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only .pdf and .txt files are allowed!'));
};

// 10MB limit
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});
