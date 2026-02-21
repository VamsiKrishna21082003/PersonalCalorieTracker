import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary - supports both CLOUDINARY_URL and individual variables
if (process.env.CLOUDINARY_URL) {
  cloudinary.config();
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'calorie-tracker',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result!.secure_url);
        }
      }
    );

    const stream = Readable.from(file.buffer);
    stream.pipe(uploadStream);
  });
};

export default cloudinary;
