import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema(
  {
    // externalId is from CricAPI when available to avoid dupes
    externalId: { type: String, index: true, sparse: true },
    name: { type: String, required: true },
    team: { type: String, required: true },
    role: { type: String, enum: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper', 'Other'], default: 'Other' },
    matches: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    hundreds: { type: Number, default: 0 },
    fifties: { type: Number, default: 0 },
    battingAverage: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    strikeRate: { type: Number, default: 0 },
    economy: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const Player = mongoose.model('Player', playerSchema);
export default Player;
