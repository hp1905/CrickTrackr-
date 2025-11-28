import express from "express";
import axios from "axios";
import { authRequired } from "../middleware/authMiddleware.js";
import Match from "../models/Match.js";

const router = express.Router();

router.get("/", authRequired, async (req, res) => {
  try {
    // Pull current matches from CricAPI on every hit (quick & simple cache)
    const url = `https://api.cricapi.com/v1/currentMatches?apikey=${process.env.CRICKET_API_KEY}&offset=0`;

    const response = await axios.get(url);

    if (response.data?.data) {
      const matches = response.data.data;

      for (const match of matches) {
        const teams = Array.isArray(match.teams) ? match.teams : [];
        const payload = {
          externalId: match.id,
          name: match.name,
          venue: match.venue || "Unknown",
          status: match.status,
          teams,
          teamA: teams[0] || "",
          teamB: teams[1] || "",
          startTime: match.dateTimeGMT || match.date || null,
          score: match.score || [],
          matchType: match.matchType || "",
          result: match.result || "",
        };
        await Match.findOneAndUpdate(
          { externalId: match.id },
          { $set: payload },
          { upsert: true, new: true }
        );
      }
    }

    // Return only recent matches (last 5 days forward) sorted earliest first
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const recent = await Match.find({ startTime: { $gte: fiveDaysAgo } }).sort({ startTime: 1 });
    return res.json(
      recent.map((m) => ({
        id: m.externalId || m._id,
        name: m.name,
        venue: m.venue,
        status: m.status,
        teams: m.teams,
        teamA: m.teamA,
        teamB: m.teamB,
        startTime: m.startTime,
        score: m.score,
        matchType: m.matchType,
        result: m.result,
      }))
    );
  } catch (error) {
    console.error("❌ Cricket API Error:", error.message);
    try {
      // Fall back to cached Mongo matches if the API call fails
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const fallback = await Match.find({ startTime: { $gte: fiveDaysAgo } }).sort({ startTime: 1 });
      return res.json(
        fallback.map((m) => ({
          id: m.externalId || m._id,
          name: m.name,
          venue: m.venue,
          status: m.status,
          teams: m.teams,
          teamA: m.teamA,
          teamB: m.teamB,
          startTime: m.startTime,
          score: m.score,
          matchType: m.matchType,
          result: m.result,
        }))
      );
    } catch (err) {
      console.error("❌ Fallback match fetch error:", err.message);
      res.status(500).json({ error: "Failed to fetch live matches" });
    }
  }
});

export default router;
