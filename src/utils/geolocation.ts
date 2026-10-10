import { SavedPlace, Task } from '../types';

export const DEFAULT_PRESET_PLACES: SavedPlace[] = [
  {
    id: 'place-home',
    name: 'Home (Veedu)',
    labelThanglish: 'Veedu',
    latitude: 13.0827,
    longitude: 80.2707,
    radius: 150, // meters
  },
  {
    id: 'place-office',
    name: 'Office (Velai)',
    labelThanglish: 'Office',
    latitude: 12.9716,
    longitude: 80.2435,
    radius: 200,
  },
  {
    id: 'place-gym',
    name: 'Fitness Gym',
    labelThanglish: 'Gym',
    latitude: 13.0418,
    longitude: 80.2341,
    radius: 120,
  },
  {
    id: 'place-market',
    name: 'Supermarket / Grocery',
    labelThanglish: 'Market',
    latitude: 13.0604,
    longitude: 80.2496,
    radius: 150,
  },
];

// Haversine formula in meters
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export interface GeofenceCheckResult {
  task: Task;
  triggerType: 'arrive' | 'depart';
  distance: number;
  placeName: string;
}

// Check which tasks trigger based on user's current coordinates
export function evaluateLocationTriggers(
  tasks: Task[],
  userLat: number,
  userLng: number,
  previousLat?: number,
  previousLng?: number,
  savedPlaces: SavedPlace[] = DEFAULT_PRESET_PLACES
): GeofenceCheckResult[] {
  const triggered: GeofenceCheckResult[] = [];

  for (const task of tasks) {
    if (task.completed || !task.locationTrigger || task.locationTrigger.triggered) {
      continue;
    }

    const { type, placeName, radiusMeters } = task.locationTrigger;

    // Find place coordinates
    let targetLat = task.locationTrigger.latitude;
    let targetLng = task.locationTrigger.longitude;

    if (targetLat === undefined || targetLng === undefined) {
      const matchedPlace = savedPlaces.find(
        (p) =>
          p.name.toLowerCase().includes(placeName.toLowerCase()) ||
          p.labelThanglish.toLowerCase().includes(placeName.toLowerCase())
      );
      if (matchedPlace) {
        targetLat = matchedPlace.latitude;
        targetLng = matchedPlace.longitude;
      }
    }

    if (targetLat === undefined || targetLng === undefined) continue;

    const currentDistance = calculateDistanceMeters(userLat, userLng, targetLat, targetLng);
    const radius = radiusMeters || 150;

    const isCurrentlyInside = currentDistance <= radius;

    let wasInside = false;
    if (previousLat !== undefined && previousLng !== undefined) {
      const prevDistance = calculateDistanceMeters(previousLat, previousLng, targetLat, targetLng);
      wasInside = prevDistance <= radius;
    }

    if (type === 'arrive') {
      // Trigger if arrived into radius (or if initial check is inside)
      if (isCurrentlyInside && !wasInside) {
        triggered.push({
          task,
          triggerType: 'arrive',
          distance: currentDistance,
          placeName,
        });
      }
    } else if (type === 'depart') {
      // Trigger if user moved outside after being inside
      if (!isCurrentlyInside && wasInside) {
        triggered.push({
          task,
          triggerType: 'depart',
          distance: currentDistance,
          placeName,
        });
      }
    }
  }

  return triggered;
}
