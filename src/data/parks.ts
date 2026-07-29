/**
 * U.S. National Parks & National Monuments in the continental United States
 * that are reachable by private car.
 *
 * Excluded (not car-accessible or not CONUS):
 * - Alaska & Hawaii units, territories
 * - Boat / seaplane / ferry-only (e.g. Channel Islands, Dry Tortugas, Isle Royale,
 *   Rainbow Bridge, Statue of Liberty, Fort Sumter primary access)
 * - Biscayne (primarily water access)
 *
 * Coordinates are visitor center / main entrance approximations for road-trip planning.
 */

export type SiteDesignation = 'National Park' | 'National Monument';

export type ParkSite = {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  /** Short planning note */
  note?: string;
  /** nps.gov park code for links (when managed by NPS) */
  npsCode?: string;
  designation: SiteDesignation;
};

/** @deprecated use ParkSite — kept for existing imports */
export type NationalPark = ParkSite;

const NATIONAL_PARK_UNITS: ParkSite[] = [
  { id: 'acad', name: 'Acadia', state: 'ME', lat: 44.3386, lng: -68.2733, npsCode: 'acad', designation: 'National Park' },
  { id: 'arch', name: 'Arches', state: 'UT', lat: 38.7331, lng: -109.5925, npsCode: 'arch', designation: 'National Park' },
  { id: 'badl', name: 'Badlands', state: 'SD', lat: 43.8554, lng: -102.3397, npsCode: 'badl', designation: 'National Park' },
  { id: 'bibe', name: 'Big Bend', state: 'TX', lat: 29.1275, lng: -103.2425, npsCode: 'bibe', note: 'Remote — plan Superchargers carefully', designation: 'National Park' },
  { id: 'blca', name: 'Black Canyon of the Gunnison', state: 'CO', lat: 38.5754, lng: -107.7416, npsCode: 'blca', designation: 'National Park' },
  { id: 'brca', name: 'Bryce Canyon', state: 'UT', lat: 37.5930, lng: -112.1871, npsCode: 'brca', designation: 'National Park' },
  { id: 'cany', name: 'Canyonlands', state: 'UT', lat: 38.3269, lng: -109.8783, npsCode: 'cany', designation: 'National Park' },
  { id: 'care', name: 'Capitol Reef', state: 'UT', lat: 38.3670, lng: -111.2615, npsCode: 'care', designation: 'National Park' },
  { id: 'cave', name: 'Carlsbad Caverns', state: 'NM', lat: 32.1479, lng: -104.5567, npsCode: 'cave', designation: 'National Park' },
  { id: 'cong', name: 'Congaree', state: 'SC', lat: 33.7948, lng: -80.7821, npsCode: 'cong', designation: 'National Park' },
  { id: 'crla', name: 'Crater Lake', state: 'OR', lat: 42.8684, lng: -122.1685, npsCode: 'crla', designation: 'National Park' },
  { id: 'cuva', name: 'Cuyahoga Valley', state: 'OH', lat: 41.2808, lng: -81.5678, npsCode: 'cuva', designation: 'National Park' },
  { id: 'deva', name: 'Death Valley', state: 'CA', lat: 36.5054, lng: -117.0794, npsCode: 'deva', note: 'Extreme heat; charge before long desert stretches', designation: 'National Park' },
  { id: 'ever', name: 'Everglades', state: 'FL', lat: 25.2866, lng: -80.8987, npsCode: 'ever', designation: 'National Park' },
  { id: 'jeff', name: 'Gateway Arch', state: 'MO', lat: 38.6247, lng: -90.1848, npsCode: 'jeff', designation: 'National Park' },
  { id: 'glac', name: 'Glacier', state: 'MT', lat: 48.7596, lng: -113.7870, npsCode: 'glac', designation: 'National Park' },
  { id: 'grca', name: 'Grand Canyon', state: 'AZ', lat: 36.0544, lng: -112.1401, npsCode: 'grca', designation: 'National Park' },
  { id: 'grte', name: 'Grand Teton', state: 'WY', lat: 43.7904, lng: -110.6818, npsCode: 'grte', designation: 'National Park' },
  { id: 'grba', name: 'Great Basin', state: 'NV', lat: 38.9833, lng: -114.3000, npsCode: 'grba', note: 'Remote — limited Superchargers nearby', designation: 'National Park' },
  { id: 'grsa', name: 'Great Sand Dunes', state: 'CO', lat: 37.7916, lng: -105.5943, npsCode: 'grsa', designation: 'National Park' },
  { id: 'grsm', name: 'Great Smoky Mountains', state: 'TN', lat: 35.6118, lng: -83.4895, npsCode: 'grsm', designation: 'National Park' },
  { id: 'gumo', name: 'Guadalupe Mountains', state: 'TX', lat: 31.9231, lng: -104.8645, npsCode: 'gumo', note: 'Remote West Texas', designation: 'National Park' },
  { id: 'hosp', name: 'Hot Springs', state: 'AR', lat: 34.5217, lng: -93.0422, npsCode: 'hosp', designation: 'National Park' },
  { id: 'indu', name: 'Indiana Dunes', state: 'IN', lat: 41.6533, lng: -87.0524, npsCode: 'indu', designation: 'National Park' },
  { id: 'jotr', name: 'Joshua Tree', state: 'CA', lat: 33.8734, lng: -115.9010, npsCode: 'jotr', designation: 'National Park' },
  { id: 'seki-kings', name: 'Kings Canyon', state: 'CA', lat: 36.8879, lng: -118.5551, npsCode: 'seki', designation: 'National Park' },
  { id: 'lavo', name: 'Lassen Volcanic', state: 'CA', lat: 40.4977, lng: -121.4207, npsCode: 'lavo', designation: 'National Park' },
  { id: 'maca', name: 'Mammoth Cave', state: 'KY', lat: 37.1862, lng: -86.1002, npsCode: 'maca', designation: 'National Park' },
  { id: 'meve', name: 'Mesa Verde', state: 'CO', lat: 37.2309, lng: -108.4618, npsCode: 'meve', designation: 'National Park' },
  { id: 'mora', name: 'Mount Rainier', state: 'WA', lat: 46.8800, lng: -121.7269, npsCode: 'mora', designation: 'National Park' },
  { id: 'neri', name: 'New River Gorge', state: 'WV', lat: 37.9608, lng: -81.1483, npsCode: 'neri', designation: 'National Park' },
  { id: 'noca', name: 'North Cascades', state: 'WA', lat: 48.7718, lng: -121.2985, npsCode: 'noca', designation: 'National Park' },
  { id: 'olym', name: 'Olympic', state: 'WA', lat: 47.8021, lng: -123.6044, npsCode: 'olym', designation: 'National Park' },
  { id: 'pefo', name: 'Petrified Forest', state: 'AZ', lat: 34.9099, lng: -109.8068, npsCode: 'pefo', designation: 'National Park' },
  { id: 'pinn', name: 'Pinnacles', state: 'CA', lat: 36.4906, lng: -121.1825, npsCode: 'pinn', designation: 'National Park' },
  { id: 'redw', name: 'Redwood', state: 'CA', lat: 41.2132, lng: -124.0046, npsCode: 'redw', designation: 'National Park' },
  { id: 'romo', name: 'Rocky Mountain', state: 'CO', lat: 40.3428, lng: -105.6836, npsCode: 'romo', designation: 'National Park' },
  { id: 'sagu', name: 'Saguaro', state: 'AZ', lat: 32.2967, lng: -111.1666, npsCode: 'sagu', designation: 'National Park' },
  { id: 'seki', name: 'Sequoia', state: 'CA', lat: 36.4864, lng: -118.5658, npsCode: 'seki', designation: 'National Park' },
  { id: 'shen', name: 'Shenandoah', state: 'VA', lat: 38.2928, lng: -78.6796, npsCode: 'shen', designation: 'National Park' },
  { id: 'thro', name: 'Theodore Roosevelt', state: 'ND', lat: 46.9790, lng: -103.5387, npsCode: 'thro', designation: 'National Park' },
  { id: 'voya', name: 'Voyageurs', state: 'MN', lat: 48.4839, lng: -92.8382, npsCode: 'voya', note: 'Road to visitor centers; interior is water-based', designation: 'National Park' },
  { id: 'whsa', name: 'White Sands', state: 'NM', lat: 32.7872, lng: -106.3257, npsCode: 'whsa', designation: 'National Park' },
  { id: 'wica', name: 'Wind Cave', state: 'SD', lat: 43.5724, lng: -103.4394, npsCode: 'wica', designation: 'National Park' },
  { id: 'yell', name: 'Yellowstone', state: 'WY', lat: 44.4280, lng: -110.5885, npsCode: 'yell', designation: 'National Park' },
  { id: 'yose', name: 'Yosemite', state: 'CA', lat: 37.8651, lng: -119.5383, npsCode: 'yose', designation: 'National Park' },
  { id: 'zion', name: 'Zion', state: 'UT', lat: 37.2982, lng: -113.0263, npsCode: 'zion', designation: 'National Park' },
];

/** Car-accessible CONUS National Monuments (primarily NPS; visitor-center coords) */
const NATIONAL_MONUMENTS: ParkSite[] = [
  { id: 'agfo', name: 'Agate Fossil Beds', state: 'NE', lat: 42.4217, lng: -103.7533, npsCode: 'agfo', designation: 'National Monument' },
  { id: 'alfl', name: 'Alibates Flint Quarries', state: 'TX', lat: 35.5831, lng: -101.6714, npsCode: 'alfl', designation: 'National Monument' },
  { id: 'azru', name: 'Aztec Ruins', state: 'NM', lat: 36.8353, lng: -107.9981, npsCode: 'azru', designation: 'National Monument' },
  { id: 'band', name: 'Bandelier', state: 'NM', lat: 35.7790, lng: -106.2708, npsCode: 'band', designation: 'National Monument' },
  { id: 'cabr', name: 'Cabrillo', state: 'CA', lat: 32.6735, lng: -117.2425, npsCode: 'cabr', designation: 'National Monument' },
  { id: 'cach', name: 'Canyon de Chelly', state: 'AZ', lat: 36.1540, lng: -109.5390, npsCode: 'cach', note: 'Navajo Nation — check tribal access rules', designation: 'National Monument' },
  { id: 'cagr', name: 'Casa Grande Ruins', state: 'AZ', lat: 32.9955, lng: -111.5357, npsCode: 'cagr', designation: 'National Monument' },
  { id: 'cavo', name: 'Capulin Volcano', state: 'NM', lat: 36.7822, lng: -103.9697, npsCode: 'cavo', designation: 'National Monument' },
  { id: 'cebr', name: 'Cedar Breaks', state: 'UT', lat: 37.6428, lng: -112.8460, npsCode: 'cebr', designation: 'National Monument' },
  { id: 'chir', name: 'Chiricahua', state: 'AZ', lat: 32.0056, lng: -109.3563, npsCode: 'chir', designation: 'National Monument' },
  { id: 'colm', name: 'Colorado', state: 'CO', lat: 39.0403, lng: -108.6919, npsCode: 'colm', designation: 'National Monument' },
  { id: 'crmo', name: 'Craters of the Moon', state: 'ID', lat: 43.4620, lng: -113.5617, npsCode: 'crmo', designation: 'National Monument' },
  { id: 'deto', name: "Devils Tower", state: 'WY', lat: 44.5902, lng: -104.7146, npsCode: 'deto', designation: 'National Monument' },
  { id: 'dino', name: 'Dinosaur', state: 'CO', lat: 40.4403, lng: -109.3047, npsCode: 'dino', note: 'CO/UT — multiple entrances', designation: 'National Monument' },
  { id: 'efmo', name: 'Effigy Mounds', state: 'IA', lat: 43.0886, lng: -91.1854, npsCode: 'efmo', designation: 'National Monument' },
  { id: 'elma', name: 'El Malpais', state: 'NM', lat: 34.8764, lng: -107.9975, npsCode: 'elma', designation: 'National Monument' },
  { id: 'elmo', name: 'El Morro', state: 'NM', lat: 35.0389, lng: -108.3389, npsCode: 'elmo', designation: 'National Monument' },
  { id: 'flfo', name: 'Florissant Fossil Beds', state: 'CO', lat: 38.9133, lng: -105.2856, npsCode: 'flfo', designation: 'National Monument' },
  { id: 'fobu', name: 'Fossil Butte', state: 'WY', lat: 41.8564, lng: -110.7667, npsCode: 'fobu', designation: 'National Monument' },
  { id: 'foun', name: 'Fort Union', state: 'NM', lat: 35.9072, lng: -105.0147, npsCode: 'foun', designation: 'National Monument' },
  { id: 'gicl', name: 'Gila Cliff Dwellings', state: 'NM', lat: 33.2272, lng: -108.2722, npsCode: 'gicl', note: 'Remote mountain road', designation: 'National Monument' },
  { id: 'hafo', name: 'Hagerman Fossil Beds', state: 'ID', lat: 42.7881, lng: -114.9447, npsCode: 'hafo', designation: 'National Monument' },
  { id: 'hove', name: 'Hovenweep', state: 'UT', lat: 37.3839, lng: -109.0772, npsCode: 'hove', designation: 'National Monument' },
  { id: 'jeca', name: 'Jewel Cave', state: 'SD', lat: 43.7294, lng: -103.8294, npsCode: 'jeca', designation: 'National Monument' },
  { id: 'joda', name: 'John Day Fossil Beds', state: 'OR', lat: 44.5536, lng: -119.6447, npsCode: 'joda', note: 'Three widely separated units', designation: 'National Monument' },
  { id: 'labe', name: 'Lava Beds', state: 'CA', lat: 41.7139, lng: -121.5097, npsCode: 'labe', designation: 'National Monument' },
  { id: 'libi', name: 'Little Bighorn Battlefield', state: 'MT', lat: 45.5653, lng: -107.4275, npsCode: 'libi', designation: 'National Monument' },
  { id: 'moca', name: 'Montezuma Castle', state: 'AZ', lat: 34.6114, lng: -111.8381, npsCode: 'moca', designation: 'National Monument' },
  { id: 'muwo', name: 'Muir Woods', state: 'CA', lat: 37.8970, lng: -122.5811, npsCode: 'muwo', note: 'Parking reservations often required', designation: 'National Monument' },
  { id: 'nabr', name: 'Natural Bridges', state: 'UT', lat: 37.6014, lng: -110.0133, npsCode: 'nabr', designation: 'National Monument' },
  { id: 'nava', name: 'Navajo', state: 'AZ', lat: 36.6789, lng: -110.5411, npsCode: 'nava', designation: 'National Monument' },
  { id: 'orca', name: 'Oregon Caves', state: 'OR', lat: 42.0981, lng: -123.4069, npsCode: 'orca', designation: 'National Monument' },
  { id: 'orpi', name: 'Organ Pipe Cactus', state: 'AZ', lat: 31.9542, lng: -112.8017, npsCode: 'orpi', note: 'Border region — check current access', designation: 'National Monument' },
  { id: 'petr', name: 'Petroglyph', state: 'NM', lat: 35.1392, lng: -106.7617, npsCode: 'petr', designation: 'National Monument' },
  { id: 'pisp', name: 'Pipe Spring', state: 'AZ', lat: 36.8628, lng: -112.7369, npsCode: 'pisp', designation: 'National Monument' },
  { id: 'popi', name: "Pompeys Pillar", state: 'MT', lat: 45.9956, lng: -108.0053, npsCode: 'popi', designation: 'National Monument' },
  { id: 'ruca', name: 'Russell Cave', state: 'AL', lat: 34.9767, lng: -85.8089, npsCode: 'ruca', designation: 'National Monument' },
  { id: 'sapu', name: 'Salinas Pueblo Missions', state: 'NM', lat: 34.2597, lng: -106.2028, npsCode: 'sapu', designation: 'National Monument' },
  { id: 'scbl', name: 'Scotts Bluff', state: 'NE', lat: 41.8356, lng: -103.7072, npsCode: 'scbl', designation: 'National Monument' },
  { id: 'sucr', name: 'Sunset Crater Volcano', state: 'AZ', lat: 35.3656, lng: -111.5031, npsCode: 'sucr', designation: 'National Monument' },
  { id: 'tica', name: 'Timpanogos Cave', state: 'UT', lat: 40.4406, lng: -111.7094, npsCode: 'tica', note: 'Cave tour requires hike from parking', designation: 'National Monument' },
  { id: 'tont', name: 'Tonto', state: 'AZ', lat: 33.6542, lng: -111.1108, npsCode: 'tont', designation: 'National Monument' },
  { id: 'tuzi', name: 'Tuzigoot', state: 'AZ', lat: 34.7706, lng: -112.0261, npsCode: 'tuzi', designation: 'National Monument' },
  { id: 'waca', name: 'Walnut Canyon', state: 'AZ', lat: 35.1717, lng: -111.5094, npsCode: 'waca', designation: 'National Monument' },
  { id: 'wupa', name: 'Wupatki', state: 'AZ', lat: 35.5206, lng: -111.3731, npsCode: 'wupa', designation: 'National Monument' },
  { id: 'waco', name: 'Waco Mammoth', state: 'TX', lat: 31.6058, lng: -97.1750, npsCode: 'waco', designation: 'National Monument' },
  { id: 'fomc', name: 'Fort McHenry', state: 'MD', lat: 39.2631, lng: -76.5797, npsCode: 'fomc', designation: 'National Monument' },
];

/** All car-accessible CONUS parks + monuments for the planner */
export const NATIONAL_PARKS: ParkSite[] = [
  ...NATIONAL_PARK_UNITS,
  ...NATIONAL_MONUMENTS,
].sort((a, b) => a.name.localeCompare(b.name));

export function parkNpsUrl(site: ParkSite): string {
  if (site.npsCode) return `https://www.nps.gov/${site.npsCode}/`;
  return `https://www.nps.gov/findapark/index.htm`;
}

export function siteLabel(site: ParkSite): string {
  return site.designation === 'National Monument'
    ? `${site.name} National Monument`
    : `${site.name} National Park`;
}

export function siteShortTag(site: ParkSite): string {
  return site.designation === 'National Monument' ? 'NM' : 'NP';
}

export function countByDesignation(sites: ParkSite[]): {
  parks: number;
  monuments: number;
} {
  let parks = 0;
  let monuments = 0;
  for (const s of sites) {
    if (s.designation === 'National Monument') monuments++;
    else parks++;
  }
  return { parks, monuments };
}
