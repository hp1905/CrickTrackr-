import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import Player from '../models/Player.js';

dotenv.config();

const ids = [
  'fe07f9f3-69e4-4526-aae4-67f8285aabc6',
  '49302a3e-86da-44d2-b365-0fdf51d9f610',
  'cb293d4f-e275-40c2-8994-7084714aef3e',
  '2fde8dba-85cb-4713-aa1e-f7c5be1b3179',
  '12e66295-cb44-4f0a-8494-01df39cfdb0f',
  '09c3e5a8-b546-414e-9bb9-e61d66f9aa4d',
  '23358c69-18bf-4bb1-8854-eee25243b663',
  'a397ac0e-1d9d-4881-9699-85f6f8db0bf7',
  '131665e2-fd64-4432-9eec-0acbf9c49b9d',
  'c1dacd9f-9c5b-40dd-8f95-7da27a7b8424',
  '61c72bae-4beb-46da-a7e0-4c3830a847b1',
  'a6926d29-bd59-46c0-9e2d-00073934dcb4',
  'a569283e-b724-483e-b2f0-da72db2d7964',
  '0c70a894-c5f9-4c05-82ed-c3273f8f4626',
  '1604fb15-bbf2-4d07-bb36-e18041da638b',
  '6115516d-6f5f-4d96-904d-b284ec24b1b8',
  'ed572c18-a53f-4cc1-bd56-a943bff1a452',
  '8d2fa6c1-7dc1-4626-8fb8-5006b1e50b6b',
  '10bee586-aa99-4313-9e4f-5ee6b0a3ca35',
  '8ae0696d-6c35-40f1-8bca-98808e79e836',
  'a66f15b1-0516-4d30-b170-d92915ec21d8',
  '7a864bf7-ed5c-41e2-9ff3-aa2b7a7a9539',
  '032baf6f-8988-4b13-a4c3-10ebd5665231',
  '50708177-9944-45b2-8fa2-1caa6c4a7c41',
  '44d8f963-fea4-40e8-8c8b-8dd93b7cf54b',
];

// Map the raw CricAPI role text into our enum
const roleFromString = (roleText = '') => {
  const t = roleText.toLowerCase();
  if (t.includes('wicket')) return 'Wicket-Keeper';
  if (t.includes('all')) return 'All-Rounder';
  if (t.includes('bowl')) return 'Bowler';
  if (t.includes('bat')) return 'Batsman';
  return 'Other';
};

// Pull a single stat value for a fn/matchtype/stat label combo
const normalizeStat = (stats, fn, matchtype, statLabel) => {
  if (!Array.isArray(stats)) return 0;
  const match = stats.find((s) => {
    const fnMatch = (s.fn || '').trim().toLowerCase() === fn;
    const mtMatch = (s.matchtype || '').trim().toLowerCase() === matchtype;
    const label = (s.stat || '').replace(/\s+/g, ' ').trim().toLowerCase();
    return fnMatch && mtMatch && label === statLabel;
  });
  const val = match ? Number(String(match.value).replace(/\s+/g, '')) : 0;
  return Number.isFinite(val) ? val : 0;
};

async function importPlayers() {
  const uri = process.env.MONGO_URI;
  const key = process.env.CRICKET_API_KEY;
  if (!uri || !key) throw new Error('Missing MONGO_URI or CRICKET_API_KEY');

  // Connect once, then upsert each player by externalId/name
  await mongoose.connect(uri);

  const baseUrl = 'https://api.cricapi.com/v1/players_info';
  const saved = [];

  for (const id of ids) {
    try {
      const url = `${baseUrl}?apikey=${key}&id=${id}`;
      const response = await axios.get(url);
      const d = response.data?.data;
      if (!d?.name) {
        console.log(`No data for ${id}`);
        continue;
      }

      const stats = d.stats || [];
      // Prefer ODI stats, then fall back to T20/Test so we always fill something
      const runs =
        normalizeStat(stats, 'batting', 'odi', 'runs') ||
        normalizeStat(stats, 'batting', 't20', 'runs') ||
        normalizeStat(stats, 'batting', 'test', 'runs');
      const matches =
        normalizeStat(stats, 'batting', 'odi', 'm') ||
        normalizeStat(stats, 'batting', 't20', 'm') ||
        normalizeStat(stats, 'batting', 'test', 'm');
      const battingAverage =
        normalizeStat(stats, 'batting', 'odi', 'avg') ||
        normalizeStat(stats, 'batting', 't20', 'avg') ||
        normalizeStat(stats, 'batting', 'test', 'avg');
      const strikeRate =
        normalizeStat(stats, 'batting', 'odi', 'sr') ||
        normalizeStat(stats, 'batting', 't20', 'sr') ||
        normalizeStat(stats, 'batting', 'test', 'sr');
      const hundreds =
        normalizeStat(stats, 'batting', 'odi', '100') ||
        normalizeStat(stats, 'batting', 't20', '100') ||
        normalizeStat(stats, 'batting', 'test', '100');
      const fifties =
        normalizeStat(stats, 'batting', 'odi', '50') ||
        normalizeStat(stats, 'batting', 't20', '50') ||
        normalizeStat(stats, 'batting', 'test', '50');
      const wickets =
        normalizeStat(stats, 'bowling', 'odi', 'wkts') ||
        normalizeStat(stats, 'bowling', 't20', 'wkts') ||
        normalizeStat(stats, 'bowling', 'test', 'wkts');
      const economy =
        normalizeStat(stats, 'bowling', 'odi', 'econ') ||
        normalizeStat(stats, 'bowling', 't20', 'econ') ||
        normalizeStat(stats, 'bowling', 'test', 'econ');

      // Shape into our Player schema fields
      const payload = {
        externalId: d.id,
        name: d.name,
        team: d.country || 'Unknown',
        role: roleFromString(d.role),
        matches,
        runs,
        hundreds,
        fifties,
        battingAverage,
        wickets,
        strikeRate,
        economy,
      };

      const player = await Player.findOneAndUpdate(
        { $or: [{ externalId: d.id }, { name: d.name }] },
        { $set: payload },
        { upsert: true, new: true } // keep existing players in sync, create if missing
      );
      console.log(`Imported ${player.name} (${player.team})`);
      saved.push(player.name);
    } catch (err) {
      console.error(`Failed ${id}:`, err?.message || err);
    }
  }

  await mongoose.disconnect();
  console.log(`Done. Imported/updated ${saved.length} players.`);
}

importPlayers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
