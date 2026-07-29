/**
 * Seasonal road access, timed entry, and travel advisories for major sites.
 * Month is 1–12. Approximate — always verify on nps.gov before travel.
 */

export type SeasonalNote = {
  siteId: string;
  /** Inclusive month range (1–12). If end < start, wraps year (e.g. Nov–Apr). */
  months: { start: number; end: number };
  severity: 'info' | 'caution' | 'closed';
  title: string;
  detail: string;
};

export const SEASONAL_NOTES: SeasonalNote[] = [
  // National Parks — high roads / entry
  {
    siteId: 'romo',
    months: { start: 5, end: 10 },
    severity: 'caution',
    title: 'Timed entry (peak)',
    detail:
      'Rocky Mountain often requires timed entry in peak season (late spring–mid fall). Book on recreation.gov.',
  },
  {
    siteId: 'romo',
    months: { start: 11, end: 5 },
    severity: 'closed',
    title: 'Trail Ridge Road',
    detail:
      'Trail Ridge Road typically closed late fall through late spring. West/east sides may need separate approaches.',
  },
  {
    siteId: 'glac',
    months: { start: 10, end: 6 },
    severity: 'closed',
    title: 'Going-to-the-Sun Road',
    detail:
      'Going-to-the-Sun often closed mid-fall through early/mid summer. Check plow status before planning a traverse.',
  },
  {
    siteId: 'glac',
    months: { start: 7, end: 9 },
    severity: 'caution',
    title: 'Peak congestion',
    detail:
      'Logan Pass and GTTSR can fill early. Arrive early; shuttles may be required in busy corridors.',
  },
  {
    siteId: 'yose',
    months: { start: 11, end: 5 },
    severity: 'closed',
    title: 'Tioga & Glacier Point roads',
    detail:
      'Tioga Road (120) and Glacier Point Road typically closed in winter. Valley stays open with possible chains.',
  },
  {
    siteId: 'yose',
    months: { start: 5, end: 9 },
    severity: 'caution',
    title: 'Peak visitation',
    detail:
      'Summer weekends are extremely busy. Parking fills early; consider early entry or valley lodging.',
  },
  {
    siteId: 'seki',
    months: { start: 11, end: 5 },
    severity: 'caution',
    title: 'High Sierra access',
    detail:
      'Mineral King and some high roads close in winter. Generals Highway may need chains; check Caltrans.',
  },
  {
    siteId: 'seki-kings',
    months: { start: 11, end: 5 },
    severity: 'caution',
    title: 'Seasonal road limits',
    detail:
      'Kings Canyon Scenic Byway (to Cedar Grove) often closes late fall–spring. Confirm before driving in.',
  },
  {
    siteId: 'crla',
    months: { start: 10, end: 6 },
    severity: 'caution',
    title: 'Rim Drive / snow',
    detail:
      'Rim Drive and north entrance often limited by snow into early summer. West/south access is more reliable.',
  },
  {
    siteId: 'mora',
    months: { start: 10, end: 6 },
    severity: 'caution',
    title: 'Paradise & Sunrise roads',
    detail:
      'Sunrise Road usually closed in winter. Chains may be required on Paradise Road; check WSDOT.',
  },
  {
    siteId: 'noca',
    months: { start: 11, end: 5 },
    severity: 'closed',
    title: 'Highway 20 (North Cascades Hwy)',
    detail:
      'SR-20 through the park often closes mid-fall to late spring. East/west sides may be separate trips.',
  },
  {
    siteId: 'olym',
    months: { start: 11, end: 4 },
    severity: 'caution',
    title: 'Hurricane Ridge',
    detail:
      'Hurricane Ridge Road can close for snow/ice on short notice in winter. Coastal areas stay more accessible.',
  },
  {
    siteId: 'yell',
    months: { start: 11, end: 4 },
    severity: 'caution',
    title: 'Interior roads',
    detail:
      'Most interior park roads close mid-fall to late spring (except limited winter access to Mammoth/Old Faithful by snow coach).',
  },
  {
    siteId: 'grte',
    months: { start: 11, end: 4 },
    severity: 'caution',
    title: 'Teton Park Road',
    detail:
      'Teton Park Road and some loops close seasonally. US-89/191 usually open year-round.',
  },
  {
    siteId: 'arch',
    months: { start: 3, end: 10 },
    severity: 'info',
    title: 'Busy season',
    detail:
      'Arches is very busy spring–fall. Timed entry rules change by year—verify on nps.gov/arch.',
  },
  {
    siteId: 'zion',
    months: { start: 3, end: 11 },
    severity: 'caution',
    title: 'Shuttle season',
    detail:
      'Scenic Drive typically requires free shuttles most of the year. Private cars limited when shuttle runs.',
  },
  {
    siteId: 'brca',
    months: { start: 11, end: 3 },
    severity: 'info',
    title: 'Winter access',
    detail:
      'Park stays open in winter; some rim walks icy. Southern Utah can have snow on higher roads.',
  },
  {
    siteId: 'deva',
    months: { start: 5, end: 9 },
    severity: 'caution',
    title: 'Extreme heat',
    detail:
      'Summer cabin temps routinely 110°F+. Charge before long desert stretches; avoid midday hiking.',
  },
  {
    siteId: 'jotr',
    months: { start: 5, end: 9 },
    severity: 'caution',
    title: 'Hot desert',
    detail:
      'Summer heat and monsoon storms. Carry water; parking fills on spring weekends.',
  },
  {
    siteId: 'acad',
    months: { start: 12, end: 3 },
    severity: 'info',
    title: 'Off-season',
    detail:
      'Park Loop Road partially closed in winter; carriage roads great for fat bikes/snowshoes.',
  },
  {
    siteId: 'grsm',
    months: { start: 6, end: 10 },
    severity: 'info',
    title: 'Peak traffic',
    detail:
      'Cades Cove and Newfound Gap can jam on summer/fall weekends. Enter early.',
  },
  {
    siteId: 'shen',
    months: { start: 12, end: 3 },
    severity: 'caution',
    title: 'Skyline Drive sections',
    detail:
      'Skyline Drive may close for ice/snow. Check park Twitter/road status before climbing the ridge.',
  },
  {
    siteId: 'meve',
    months: { start: 11, end: 4 },
    severity: 'caution',
    title: 'Mesa Top access',
    detail:
      'Wetherill Mesa and some cliff dwellings limited or closed in winter; weather can close the mesa road.',
  },
  {
    siteId: 'blca',
    months: { start: 11, end: 4 },
    severity: 'caution',
    title: 'South Rim vs North',
    detail:
      'North Rim / East Portal access is more seasonal. South Rim is the reliable winter approach.',
  },
  {
    siteId: 'grsa',
    months: { start: 11, end: 3 },
    severity: 'info',
    title: 'Cold nights',
    detail:
      'Sand board season is great in cooler months; Medano Pass 4WD road is seasonal.',
  },
  {
    siteId: 'bibe',
    months: { start: 5, end: 9 },
    severity: 'caution',
    title: 'Remote heat',
    detail:
      'Very remote Supercharger coverage. Summer heat is severe—plan energy and water carefully.',
  },
  {
    siteId: 'voya',
    months: { start: 11, end: 4 },
    severity: 'info',
    title: 'Winter mode',
    detail:
      'Roads to visitor centers stay open; interior travel is snowmobile/ski oriented in winter.',
  },
  // Monuments
  {
    siteId: 'cebr',
    months: { start: 11, end: 5 },
    severity: 'closed',
    title: 'Scenic Drive',
    detail:
      'Cedar Breaks Scenic Drive and visitor center hours are limited in heavy snow season.',
  },
  {
    siteId: 'deto',
    months: { start: 11, end: 3 },
    severity: 'info',
    title: 'Winter',
    detail:
      'Tower remains accessible; tower trail can be icy. Services limited nearby in deep winter.',
  },
  {
    siteId: 'crmo',
    months: { start: 11, end: 4 },
    severity: 'caution',
    title: 'Loop road',
    detail:
      'Craters of the Moon loop road may close or need caution in winter/spring snow.',
  },
  {
    siteId: 'dino',
    months: { start: 11, end: 4 },
    severity: 'caution',
    title: 'Harpers Corner / high roads',
    detail:
      'Some scenic roads and Yampa access are seasonal. Quarry area more reliable year-round.',
  },
  {
    siteId: 'muwo',
    months: { start: 1, end: 12 },
    severity: 'caution',
    title: 'Parking reservations',
    detail:
      'Muir Woods often requires parking reservations year-round. Book before you drive.',
  },
  {
    siteId: 'tica',
    months: { start: 11, end: 3 },
    severity: 'caution',
    title: 'Cave trail',
    detail:
      'Cave tours depend on weather; the hike from parking can be icy in winter.',
  },
  {
    siteId: 'orpi',
    months: { start: 5, end: 9 },
    severity: 'caution',
    title: 'Border heat',
    detail:
      'Extreme heat and remote desert driving. Confirm Ajo Mountain Drive conditions.',
  },
  {
    siteId: 'labe',
    months: { start: 11, end: 3 },
    severity: 'info',
    title: 'Cave ice',
    detail:
      'Lava Beds stays open; underground trails are cold year-round—bring layers.',
  },
  {
    siteId: 'nabr',
    months: { start: 11, end: 3 },
    severity: 'info',
    title: 'Remote winter',
    detail:
      'Natural Bridges is high and remote; services sparse; check road conditions from Blanding.',
  },
  {
    siteId: 'colm',
    months: { start: 1, end: 12 },
    severity: 'info',
    title: 'Rim Rock Drive',
    detail:
      'Rim Rock Drive can close briefly for rockfall or ice. Tunnel width limits large vehicles.',
  },
];

function monthInRange(month: number, start: number, end: number): boolean {
  if (start <= end) return month >= start && month <= end;
  return month >= start || month <= end;
}

export function notesForSite(
  siteId: string,
  month: number,
): SeasonalNote[] {
  return SEASONAL_NOTES.filter(
    (n) =>
      n.siteId === siteId &&
      monthInRange(month, n.months.start, n.months.end),
  );
}

export function notesForTrip(
  siteIds: string[],
  month: number,
): SeasonalNote[] {
  const out: SeasonalNote[] = [];
  const seen = new Set<string>();
  for (const id of siteIds) {
    for (const n of notesForSite(id, month)) {
      const key = `${n.siteId}:${n.title}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(n);
      }
    }
  }
  // severity order: closed, caution, info
  const rank = { closed: 0, caution: 1, info: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;
