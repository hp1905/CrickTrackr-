import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Match from '../models/Match.js';

dotenv.config();

// Manual fixtures for when the API has no upcoming data
const fixtures = [
  {
    externalId: 'manual-ashes-warmup-day1',
    name: 'Prime Ministers XI vs England, Warm-up Day 1',
    teams: ['Prime Ministers XI', 'England'],
    venue: 'Manuka Oval, Canberra',
    startTime: '2025-11-29T03:40:00Z',
    matchType: 'test',
  },
  {
    externalId: 'manual-ban-ire-2nd-t20i',
    name: 'Bangladesh vs Ireland, 2nd T20I',
    teams: ['Bangladesh', 'Ireland'],
    venue: 'Bir Sreshtho Flight Lieutenant Matiur Rahman Stadium, Chattogram',
    startTime: '2025-11-29T12:00:00Z',
    matchType: 't20',
  },
  {
    externalId: 'manual-pak-sl-final',
    name: 'Pakistan vs Sri Lanka, Final',
    teams: ['Pakistan', 'Sri Lanka'],
    venue: 'Rawalpindi Cricket Stadium, Rawalpindi',
    startTime: '2025-11-29T13:00:00Z',
    matchType: 't20',
  },
  {
    externalId: 'manual-arg-bra-2nd-t20i',
    name: 'Argentina vs Brazil, 2nd T20I',
    teams: ['Argentina', 'Brazil'],
    venue: 'St Albans Club, Corimayo, Buenos Aires',
    startTime: '2025-11-29T13:00:00Z',
    matchType: 't20',
  },
  {
    externalId: 'manual-arg-bra-3rd-t20i',
    name: 'Argentina vs Brazil, 3rd T20I',
    teams: ['Argentina', 'Brazil'],
    venue: 'St Albans Club, Corimayo, Buenos Aires',
    startTime: '2025-11-29T18:00:00Z',
    matchType: 't20',
  },
  {
    externalId: 'manual-bahrain-thailand-5th',
    name: 'Bahrain vs Thailand, 5th Match',
    teams: ['Bahrain', 'Thailand'],
    venue: 'Bayuemas Oval, Kuala Lumpur',
    startTime: '2025-11-30T02:00:00Z',
    matchType: 't20',
  },
  {
    externalId: 'manual-ashes-warmup-day2',
    name: 'Prime Ministers XI vs England, Warm-up Day 2',
    teams: ['Prime Ministers XI', 'England'],
    venue: 'Manuka Oval, Canberra',
    startTime: '2025-11-30T03:40:00Z',
    matchType: 'test',
  },
  {
    externalId: 'manual-ind-sa-1st-odi',
    name: 'India vs South Africa, 1st ODI',
    teams: ['India', 'South Africa'],
    venue: 'JSCA International Stadium Complex, Ranchi',
    startTime: '2025-11-30T08:00:00Z',
    matchType: 'odi',
  },
  {
    externalId: 'manual-arg-bra-4th-t20i',
    name: 'Argentina vs Brazil, 4th T20I',
    teams: ['Argentina', 'Brazil'],
    venue: 'St Albans Club, Corimayo, Buenos Aires',
    startTime: '2025-11-30T13:00:00Z',
    matchType: 't20',
  },
  {
    externalId: 'manual-arg-bra-5th-t20i',
    name: 'Argentina vs Brazil, 5th T20I',
    teams: ['Argentina', 'Brazil'],
    venue: 'St Albans Club, Corimayo, Buenos Aires',
    startTime: '2025-11-30T18:00:00Z',
    matchType: 't20',
  },
  {
    externalId: 'manual-malaysia-bahrain-6th',
    name: 'Malaysia vs Bahrain, 6th Match',
    teams: ['Malaysia', 'Bahrain'],
    venue: 'Bayuemas Oval, Kuala Lumpur',
    startTime: '2025-12-01T02:00:00Z',
    matchType: 't20',
  },
  {
    externalId: 'manual-nz-wi-1st-test-day1',
    name: 'New Zealand vs West Indies, 1st Test, Day 1',
    teams: ['New Zealand', 'West Indies'],
    venue: 'Hagley Oval, Christchurch',
    startTime: '2025-12-01T22:00:00Z',
    matchType: 'test',
  },
  {
    externalId: 'manual-ban-ire-3rd-t20i',
    name: 'Bangladesh vs Ireland, 3rd T20I',
    teams: ['Bangladesh', 'Ireland'],
    venue: 'Shere Bangla National Stadium, Dhaka',
    startTime: '2025-12-02T12:00:00Z',
    matchType: 't20',
  },
  {
    externalId: 'manual-nz-wi-1st-test-day2',
    name: 'New Zealand vs West Indies, 1st Test, Day 2',
    teams: ['New Zealand', 'West Indies'],
    venue: 'Hagley Oval, Christchurch',
    startTime: '2025-12-02T22:00:00Z',
    matchType: 'test',
  },
  {
    externalId: 'manual-ind-sa-2nd-odi',
    name: 'India vs South Africa, 2nd ODI',
    teams: ['India', 'South Africa'],
    venue: 'Shaheed Veer Narayan Singh International Stadium, Raipur',
    startTime: '2025-12-03T08:00:00Z',
    matchType: 'odi',
  },
  {
    externalId: 'manual-nz-wi-1st-test-day3',
    name: 'New Zealand vs West Indies, 1st Test, Day 3',
    teams: ['New Zealand', 'West Indies'],
    venue: 'Hagley Oval, Christchurch',
    startTime: '2025-12-03T22:00:00Z',
    matchType: 'test',
  },
  {
    externalId: 'manual-ashes-2nd-test-day1',
    name: 'Australia vs England, 2nd Test, Day 1',
    teams: ['Australia', 'England'],
    venue: 'The Gabba, Brisbane',
    startTime: '2025-12-04T04:00:00Z',
    matchType: 'test',
  },
  {
    externalId: 'manual-nz-wi-1st-test-day4',
    name: 'New Zealand vs West Indies, 1st Test, Day 4',
    teams: ['New Zealand', 'West Indies'],
    venue: 'Hagley Oval, Christchurch',
    startTime: '2025-12-04T22:00:00Z',
    matchType: 'test',
  },
  {
    externalId: 'manual-ashes-2nd-test-day2',
    name: 'Australia vs England, 2nd Test, Day 2',
    teams: ['Australia', 'England'],
    venue: 'The Gabba, Brisbane',
    startTime: '2025-12-05T04:00:00Z',
    matchType: 'test',
  },
  {
    externalId: 'manual-ind-sa-3rd-odi',
    name: 'India vs South Africa, 3rd ODI',
    teams: ['India', 'South Africa'],
    venue: 'ACA-VDCA Cricket Stadium, Visakhapatnam',
    startTime: '2025-12-05T08:00:00Z',
    matchType: 'odi',
  },
  {
    externalId: 'manual-nz-wi-1st-test-day5',
    name: 'New Zealand vs West Indies, 1st Test, Day 5',
    teams: ['New Zealand', 'West Indies'],
    venue: 'Hagley Oval, Christchurch',
    startTime: '2025-12-05T22:00:00Z',
    matchType: 'test',
  },
  {
    externalId: 'manual-ashes-2nd-test-day3',
    name: 'Australia vs England, 2nd Test, Day 3',
    teams: ['Australia', 'England'],
    venue: 'The Gabba, Brisbane',
    startTime: '2025-12-06T04:00:00Z',
    matchType: 'test',
  },
  {
    externalId: 'manual-ashes-2nd-test-day4',
    name: 'Australia vs England, 2nd Test, Day 4',
    teams: ['Australia', 'England'],
    venue: 'The Gabba, Brisbane',
    startTime: '2025-12-07T04:00:00Z',
    matchType: 'test',
  },
  {
    externalId: 'manual-bhutan-bahrain-1st-t20i',
    name: 'Bhutan vs Bahrain, 1st T20I',
    teams: ['Bhutan', 'Bahrain'],
    venue: 'Gelephu International Cricket Ground, Gelephu',
    startTime: '2025-12-08T03:30:00Z',
    matchType: 't20',
  },
  {
    externalId: 'manual-ashes-2nd-test-day5',
    name: 'Australia vs England, 2nd Test, Day 5',
    teams: ['Australia', 'England'],
    venue: 'The Gabba, Brisbane',
    startTime: '2025-12-08T04:00:00Z',
    matchType: 'test',
  },
];

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('Missing MONGO_URI');
  await mongoose.connect(uri);

  for (const fx of fixtures) {
    const teams = fx.teams || [];
    // Upsert each manual fixture by a stable externalId
    await Match.findOneAndUpdate(
      { externalId: fx.externalId },
      {
        $set: {
          externalId: fx.externalId,
          name: fx.name,
          teams,
          teamA: teams[0] || '',
          teamB: teams[1] || '',
          venue: fx.venue || '',
          status: 'Upcoming',
          startTime: fx.startTime ? new Date(fx.startTime) : null,
          matchType: fx.matchType || '',
          score: fx.score || [],
          result: fx.result || '',
        },
      },
      { upsert: true, new: true }
    );
    console.log(`Seeded/updated: ${fx.name}`);
  }

  await mongoose.disconnect();
  console.log('Done seeding upcoming fixtures.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
