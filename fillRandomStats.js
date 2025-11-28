import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from '../models/Player.js';

dotenv.config();

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const deriveStats = (roleRaw = 'Other') => {
  const role = (roleRaw || '').toLowerCase();
  const isBowler = role.includes('bowl');
  const isKeeper = role.includes('wicket');
  const isAllRounder = role.includes('all');

  // Rough ranges tuned for each role so numbers look plausible
  const matches = randInt(5, 60);
  const runsBase = isBowler ? randInt(100, 800) : randInt(400, 4000);
  const runs = runsBase;
  const hundreds = isBowler ? randInt(0, 1) : randInt(0, Math.max(0, Math.floor(runs / 800)));
  const fifties = isBowler ? randInt(0, 4) : randInt(hundreds, hundreds + randInt(2, 10));
  const battingAverage = Number((runs / Math.max(matches, 1) + randInt(5, 20)).toFixed(1));
  const wickets = isBowler || isAllRounder ? randInt(5, 140) : randInt(0, 15);
  const strikeRate = isBowler ? randInt(70, 110) : randInt(90, 150);
  const economy = Number((isBowler || isAllRounder ? randInt(42, 95) / 10 : randInt(50, 90) / 10).toFixed(1));

  return { matches, runs, hundreds, fifties, battingAverage, wickets, strikeRate, economy };
};

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('Missing MONGO_URI');

  // Populate only players that still have near-zero stats
  await mongoose.connect(uri);

  const toUpdate = await Player.find({
    runs: { $lte: 1 },
    wickets: { $lte: 1 },
    matches: { $lte: 1 },
  });

  let count = 0;
  for (const p of toUpdate) {
    const stats = deriveStats(p.role);
    Object.assign(p, stats);
    await p.save();
    count += 1;
    console.log(`Filled stats for ${p.name} (${p.team})`);
  }

  await mongoose.disconnect();
  console.log(`Updated ${count} players with generated stats.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
