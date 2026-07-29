# Model Y National Park Road Trip Planner

Interactive map for planning Tesla **Model Y AWD** road trips focused on **car-accessible U.S. National Parks** in the continental United States, with the **Tesla Supercharger** network overlaid.

## Features

- **47 car-accessible CONUS National Parks** on the map (boat/plane-only and non-continental parks excluded)
- **~3,100 Superchargers** (open/expanding) across the lower 48
- **Starting location** — presets or search (Nominatim)
- **Drag-to-reorder** trip park stops
- **Highway distances** between stops (OSRM driving routes) with total miles / drive time
- **Planned Superchargers** along the route for Model Y range
- **Save & share** — URL updates with your trip; copy link / native share / local save
- **Export to car** — Google Maps, Apple Maps, GPX (parks + planned Superchargers)
- Route polyline on the map; charge-stop hints per leg
- Parks **and national monuments** (filterable)
- Toggle layers, search/filter by state
- Model Y Long Range / Performance AWD planning ranges

### Parks left off the list

- **Not CONUS:** Alaska, Hawaii, territories  
- **Not primarily car-accessible:** Channel Islands, Dry Tortugas, Isle Royale, Biscayne  

## Quick start

```bash
cd tesla-park-planner
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build   # production build → dist/
npm run preview # preview production build
```

## Data

| Layer | Source |
|-------|--------|
| Superchargers | [supercharge.info](https://supercharge.info) snapshot in `public/data/superchargers-conus.json` |
| Parks | Curated list in `src/data/parks.ts` (visitor center / entrance coords) |

To refresh Superchargers, re-run the fetch/filter script (see project history) or replace the JSON from supercharge.info’s `allSites` API, keeping only USA sites inside CONUS bounds with status OPEN/EXPANDING.

## Stack

React · TypeScript · Vite · Tailwind CSS · Leaflet · react-leaflet · marker clustering

Not affiliated with Tesla, Inc. or the National Park Service.
