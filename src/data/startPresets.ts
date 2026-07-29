import type { GeocodeResult } from '../lib/routing';

/** Common CONUS start cities for quick pick */
export const START_PRESETS: GeocodeResult[] = [
  { label: 'Seattle, WA', lat: 47.6062, lng: -122.3321 },
  { label: 'Portland, OR', lat: 45.5152, lng: -122.6784 },
  { label: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
  { label: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
  { label: 'San Diego, CA', lat: 32.7157, lng: -117.1611 },
  { label: 'Phoenix, AZ', lat: 33.4484, lng: -112.074 },
  { label: 'Denver, CO', lat: 39.7392, lng: -104.9903 },
  { label: 'Salt Lake City, UT', lat: 40.7608, lng: -111.891 },
  { label: 'Las Vegas, NV', lat: 36.1699, lng: -115.1398 },
  { label: 'Dallas, TX', lat: 32.7767, lng: -96.797 },
  { label: 'Austin, TX', lat: 30.2672, lng: -97.7431 },
  { label: 'Houston, TX', lat: 29.7604, lng: -95.3698 },
  { label: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
  { label: 'Minneapolis, MN', lat: 44.9778, lng: -93.265 },
  { label: 'Atlanta, GA', lat: 33.749, lng: -84.388 },
  { label: 'Nashville, TN', lat: 36.1627, lng: -86.7816 },
  { label: 'Miami, FL', lat: 25.7617, lng: -80.1918 },
  { label: 'Washington, DC', lat: 38.9072, lng: -77.0369 },
  { label: 'New York, NY', lat: 40.7128, lng: -74.006 },
  { label: 'Boston, MA', lat: 42.3601, lng: -71.0589 },
];
