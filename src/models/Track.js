// src/models/Track.js
//const mongoose = require('mongoose');
import mongoose from 'mongoose';

const TrackSchema = new mongoose.Schema({
  authorName: { type: String, required: true },
  trackName: { type: String, required: true },
  duration: { type: Number, required: true },
  musicUrl: { type: String, required: true },
  coverUrl: { type: String, required: true },
});

export default mongoose.model('Track', TrackSchema);
