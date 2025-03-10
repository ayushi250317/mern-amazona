import express from 'express';
import multer from 'multer';
import AWS from 'aws-sdk';
import streamifier from 'streamifier';
import { isAdmin, isAuth } from '../utils.js';

const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage for buffer uploads
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB (adjust as needed)
});

const uploadRouter = express.Router();

// Configure AWS S3
const s3 = new AWS.S3({
  // accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  // secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
});

uploadRouter.post(
  '/',
  isAuth,
  isAdmin,
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send({ message: 'No file uploaded' });
      }

      const uploadToS3 = (fileBuffer, fileName, mimeType) => {
        const params = {
          Bucket: process.env.BUCKET_NAME, // Replace with your bucket name
          Key: `uploads/${fileName}`, // File path and name in the bucket
          Body: fileBuffer,
          ContentType: mimeType,
        };

        return s3.upload(params).promise();
      };

      // Generate unique filename if needed
      const uniqueFileName = `${Date.now()}-${req.file.originalname}`;

      // Upload the file buffer to S3
      const result = await uploadToS3(
        req.file.buffer,
        uniqueFileName,
        req.file.mimetype
      );

      // Respond with the uploaded file's URL
      res.send({ url: result.Location, key: result.Key });
    } catch (error) {
      console.error('Error uploading to S3:', error);
      res.status(500).send({ message: 'Error uploading file to S3', error });
    }
  }
);

export default uploadRouter;
