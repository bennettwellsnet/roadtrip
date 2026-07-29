import type { GeocodeResult } from '../lib/routing';

/**
 * One-click trip templates for CONUS national parks / monuments.
 * Stop ids must match parks.ts.
 */
export type TripTemplate = {
  id: string;
  name: string;
  tagline: string;
  region: string;
  /** Suggested start city */
  start: GeocodeResult;
  /** Ordered park/monument ids */
  stopIds: string[];
  returnHome: boolean;
  /** Suggested nights at each stop (optional) */
  nightsByStopId?: Record<string, number>;
  /** Calendar month 1–12 for seasonal notes */
  travelMonth?: number;
  /** Short blurb shown in the picker */
  notes?: string;
};

export const TRIP_TEMPLATES: TripTemplate[] = [
  {
    id: 'utah-loop',
    name: 'Utah Mighty 5 loop',
    tagline: 'Zion → Bryce → Capitol Reef → Arches → Canyonlands',
    region: 'Southwest',
    start: { label: 'Salt Lake City, UT', lat: 40.7608, lng: -111.891 },
    stopIds: ['zion', 'brca', 'care', 'arch', 'cany'],
    returnHome: true,
    nightsByStopId: {
      zion: 2,
      brca: 1,
      care: 1,
      arch: 2,
      cany: 1,
    },
    travelMonth: 5,
    notes: 'Classic Utah circuit from SLC. Spring/fall recommended.',
  },
  {
    id: 'socal-deserts',
    name: 'SoCal deserts',
    tagline: 'Joshua Tree · Death Valley · (optional desert drive)',
    region: 'California',
    start: { label: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
    stopIds: ['jotr', 'deva'],
    returnHome: true,
    nightsByStopId: { jotr: 2, deva: 2 },
    travelMonth: 3,
    notes: 'Charge carefully in Death Valley heat; avoid peak summer if possible.',
  },
  {
    id: 'blue-ridge',
    name: 'Blue Ridge & Smokies',
    tagline: 'Shenandoah → Great Smoky Mountains',
    region: 'East',
    start: { label: 'Washington, DC', lat: 38.9072, lng: -77.0369 },
    stopIds: ['shen', 'grsm'],
    returnHome: true,
    nightsByStopId: { shen: 2, grsm: 3 },
    travelMonth: 10,
    notes: 'Fall color classic. Add New River Gorge if you extend west.',
  },
  {
    id: 'pacific-nw',
    name: 'Pacific Northwest trio',
    tagline: 'Olympic · Mount Rainier · North Cascades',
    region: 'Northwest',
    start: { label: 'Seattle, WA', lat: 47.6062, lng: -122.3321 },
    stopIds: ['olym', 'mora', 'noca'],
    returnHome: true,
    nightsByStopId: { olym: 2, mora: 2, noca: 1 },
    travelMonth: 7,
    notes: 'Summer access is best for Cascades high country.',
  },
  {
    id: 'rockies-core',
    name: 'Rockies core',
    tagline: 'Rocky Mountain · Grand Teton · Yellowstone',
    region: 'Mountain West',
    start: { label: 'Denver, CO', lat: 39.7392, lng: -104.9903 },
    stopIds: ['romo', 'grte', 'yell'],
    returnHome: true,
    nightsByStopId: { romo: 2, grte: 2, yell: 3 },
    travelMonth: 7,
    notes: 'Longer highway days; plan Superchargers across Wyoming.',
  },
  {
    id: 'southwest-icons',
    name: 'Southwest icons',
    tagline: 'Grand Canyon · Petrified Forest · Saguaro',
    region: 'Southwest',
    start: { label: 'Phoenix, AZ', lat: 33.4484, lng: -112.074 },
    stopIds: ['sagu', 'pefo', 'grca'],
    returnHome: true,
    nightsByStopId: { sagu: 1, pefo: 1, grca: 2 },
    travelMonth: 4,
    notes: 'South Rim focus at Grand Canyon. Hot summers in Phoenix.',
  },
  {
    id: 'california-sierra',
    name: 'California Sierra',
    tagline: 'Yosemite · Sequoia · Kings Canyon',
    region: 'California',
    start: { label: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
    stopIds: ['yose', 'seki', 'seki-kings'],
    returnHome: true,
    nightsByStopId: { yose: 3, seki: 2, 'seki-kings': 1 },
    travelMonth: 6,
    notes: 'Mountain grades and Tioga seasonality — check road openings.',
  },
];

export function getTemplateById(id: string): TripTemplate | undefined {
  return TRIP_TEMPLATES.find((t) => t.id === id);
}
