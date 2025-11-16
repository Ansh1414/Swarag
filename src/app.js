import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import multer from 'multer';
import { Readable } from 'stream';
import Track from './models/Track.js';
import cloudinary from './config/cloudinary.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Multer in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper: upload buffer to Cloudinary
const uploadBufferToCloudinary = (buffer, folder, resource_type = 'raw') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
};

// --- Upload route ---
app.post('/track/upload', upload.fields([
  { name: 'musicFile', maxCount: 1 },
  { name: 'coverFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { authorName, trackName, duration } = req.body;
    const musicFile = req.files['musicFile'][0];
    const coverFile = req.files['coverFile'][0];

    // Upload files to Cloudinary
    const musicUrl = await uploadBufferToCloudinary(musicFile.buffer, 'audio', 'raw');
    const coverUrl = await uploadBufferToCloudinary(coverFile.buffer, 'covers', 'image');

    // Save metadata to MongoDB
    const newTrack = new Track({ authorName, trackName, duration, musicUrl, coverUrl });
    await newTrack.save();

    res.status(201).json({
      authorName: newTrack.authorName,
      trackName: newTrack.trackName,
      duration: newTrack.duration,
      musicUrl: newTrack.musicUrl,
      coverUrl: newTrack.coverUrl
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});

// Optional: fetch tracks
app.get('/tracks', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;

    const tracks = await Track.find()
      .skip((page - 1) * limit)
      .limit(limit);

      const formatted = tracks.map((t, index) => ({
        id: index,
        authorName: t.authorName,
        trackName: t.trackName,
        duration: t.duration,
        musicUrl: t.musicUrl,
        coverUrl: t.coverUrl
      }));

    res.json(formatted);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
