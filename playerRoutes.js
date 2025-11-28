import express from 'express';
import axios from 'axios';
import Player from '../models/Player.js';
import { authRequired } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/players - all players
router.get('/', authRequired, async (req, res) => {
  try {
    const players = await Player.find().sort({ createdAt: -1 });
    res.json(players);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/players/live - external list from CricAPI
router.get('/live', authRequired, async (_req, res) => {
  try {
    const url = `https://api.cricapi.com/v1/players?apikey=${process.env.CRICKET_API_KEY}&offset=0`;
    const response = await axios.get(url);
    const items = Array.isArray(response.data?.data) ? response.data.data : [];
    const trimmed = items.slice(0, 50).map((p) => ({
      id: p.id,
      name: p.name,
      country: p.country,
    }));
    res.json(trimmed);
  } catch (err) {
    console.error('CricAPI players fetch error:', err?.message || err);
    res.status(500).json({ message: 'Failed to fetch live players' });
  }
});

router.post('/import', authRequired, async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  if (!ids.length) return res.status(400).json({ message: 'ids array required' });

  const key = process.env.CRICKET_API_KEY;
  const baseUrl = 'https://api.cricapi.com/v1/players_info';

  const roleFromString = (roleText = '') => {
    const t = roleText.toLowerCase();
    if (t.includes('wicket')) return 'Wicket-Keeper';
    if (t.includes('all')) return 'All-Rounder';
    if (t.includes('bowl')) return 'Bowler';
    if (t.includes('bat')) return 'Batsman';
    return 'Other';
  };

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

  const fetched = [];

  for (const id of ids) {
    try {
      const url = `${baseUrl}?apikey=${key}&id=${id}`;
      const response = await axios.get(url);
      const d = response.data?.data;
      if (!d?.name) continue;

      const stats = d.stats || [];
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
        { upsert: true, new: true }
      );
      fetched.push(player);
    } catch (err) {
      console.error(`Import failed for id ${id}:`, err?.message || err);
    }
  }

  return res.json({ count: fetched.length, players: fetched });
});

// GET /api/players/:id
router.get('/:id', authRequired, async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json(player);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/players
router.post('/', authRequired, async (req, res) => {
  try {
    const {
      name,
      team,
      role,
      matches,
      runs,
      wickets,
      strikeRate,
      economy,
      hundreds,
      fifties,
      battingAverage,
    } = req.body;
    if (!name || !team) {
      return res.status(400).json({ message: 'Name and team are required' });
    }
    const player = await Player.create({
      name,
      team,
      role,
      matches: matches || 0,
      runs: runs || 0,
      hundreds: hundreds || 0,
      fifties: fifties || 0,
      battingAverage: battingAverage || 0,
      wickets: wickets || 0,
      strikeRate: strikeRate || 0,
      economy: economy || 0
    });
    res.status(201).json(player);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/players/:id
router.put('/:id', authRequired, async (req, res) => {
  try {
    const player = await Player.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json(player);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/players/:id
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);
    if (!player) return res.status(404).json({ message: 'Player not found' });
    res.json({ message: 'Player deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
