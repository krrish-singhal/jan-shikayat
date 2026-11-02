import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Cloudinary if credentials provided
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export class UploadService {
  /**
   * Uploads file buffer to Cloudinary or falls back safely to local storage.
   * @param {Object} file - Express multer file object
   * @param {string} folder - Folder name
   * @returns {Promise<string>} Public URL of uploaded image
   */
  static async uploadImage(file, folder = 'complaints') {
    if (!file || !file.buffer) {
      throw new Error('No file provided for upload');
    }

    if (isCloudinaryConfigured) {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `janshikayat/${folder}`,
            resource_type: 'image',
          },
          (error, result) => {
            if (error) {
              console.error('[Cloudinary Upload Error]', error);
              return reject(error);
            }
            resolve(result.secure_url);
          }
        );
        stream.end(file.buffer);
      });
    }

    // Local file fallback
    const ext = path.extname(file.originalname) || '.jpg';
    const randomName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const filePath = path.join(uploadsDir, randomName);

    await fs.promises.writeFile(filePath, file.buffer);
    return `/uploads/${randomName}`;
  }
}
