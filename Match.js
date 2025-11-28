import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
    // externalId lets us sync with CricAPI or manual seeds without duplication
    externalId: { type: String, index: true, unique: true, sparse: true },
    name: { type: String },
    teams: [{ type: String }],
    teamA: { type: String, default: '' },
    teamB: { type: String, default: '' },
    venue: { type: String, default: '' },
    status: { type: String, default: 'Upcoming' },
    startTime: { type: Date },
    matchType: { type: String, default: '' },
    score: { type: Array, default: [] }, // raw score objects from API
    scoreA: { type: String, default: '' }, // optional formatted scores
    scoreB: { type: String, default: '' },
    result: { type: String, default: '' }
  },
  { timestamps: true }
);

const Match = mongoose.model('Match', matchSchema);
export default Match;
