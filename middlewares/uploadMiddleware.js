import multer from 'multer';
import { storage } from '../config/cloudinary.js';

const upload = multer({ storage: storage });

export default upload;