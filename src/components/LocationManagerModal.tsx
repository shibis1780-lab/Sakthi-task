import React, { useState } from 'react';
import {
  X,
  MapPin,
  Navigation,
  Plus,
  Trash2,
  Radio,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { SavedPlace } from '../types';

interface LocationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedPlaces: SavedPlace[];
  onSavePlaces: (places: SavedPlace[]) => void;
  onSimulateLocation: (lat: number, lng: number, placeName: string, eventType: 'arrive' | 'depart') => void;
  userCoords?: { latitude: number; longitude: number };
}

export const LocationManagerModal: React.FC<LocationManagerModalProps> = ({
  isOpen,
  onClose,
  savedPlaces,
  onSavePlaces,
  onSimulateLocation,
  userCoords,
}) => {
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceLabel, setNewPlaceLabel] = useState('');
  const [newLat, setNewLat] = useState<string>('13.0827');
  const [newLng, setNewLng] = useState<string>('80.2707');
  const [newRadius, setNewRadius] = useState<number>(150);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  if (!isOpen) return null;

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewLat(pos.coords.latitude.toFixed(6));
        setNewLng(pos.coords.longitude.toFixed(6));
        setIsGettingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsGettingLocation(false);
        alert('Could not retrieve current location. You can enter coordinates manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleAddPlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaceName.trim()) return;

    const lat = parseFloat(newLat);
    const lng = parseFloat(newLng);
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid numeric latitude and longitude.');
      return;
    }

    const newPlace: SavedPlace = {
      id: `place-${Date.now()}`,
      name: newPlaceName.trim(),
      labelThanglish: newPlaceLabel.trim() || newPlaceName.trim(),
      latitude: lat,
      longitude: lng,
      radius: newRadius,
    };

    onSavePlaces([...savedPlaces, newPlace]);
    setNewPlaceName('');
    setNewPlaceLabel('');
  };

  const handleDeletePlace = (id: string) => {
    onSavePlaces(savedPlaces.filter((p) => p.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <span>Location Triggers & Geofencing</span>
            </h3>
            <p className="text-xs text-slate-400">
              Manage designated places and test arrive/depart voice alerts
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live GPS Coordinates banner */}
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div>
              <span className="font-semibold text-white">Current GPS Monitor:</span>
              <p className="text-slate-400">
                {userCoords
                  ? `${userCoords.latitude.toFixed(4)}, ${userCoords.longitude.toFixed(4)}`
                  : 'Active geolocation tracking enabled'}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
            Active
          </span>
        </div>

        {/* Quick Location Simulator for Testing */}
        <div className="mt-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4">
          <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 mb-2">
            <Navigation className="w-3.5 h-3.5" />
            <span>⚡ Instant Geofence Simulator (Test Voice Reminders):</span>
          </h4>
          <p className="text-[11px] text-slate-300 mb-3">
            Click any button below to simulate arriving at or departing from a spot. Sakthi will trigger the corresponding task reminder in Tamil male voice!
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {savedPlaces.slice(0, 4).map((place) => (
              <div key={place.id} className="flex flex-col gap-1">
                <button
                  onClick={() => onSimulateLocation(place.latitude, place.longitude, place.name, 'arrive')}
                  className="rounded-xl bg-cyan-600/80 hover:bg-cyan-500 py-1.5 px-2 text-[11px] font-bold text-white transition cursor-pointer text-center"
                >
                  Arrive {place.labelThanglish}
                </button>
                <button
                  onClick={() => onSimulateLocation(place.latitude + 0.05, place.longitude + 0.05, place.name, 'depart')}
                  className="rounded-xl bg-purple-600/80 hover:bg-purple-500 py-1.5 px-2 text-[11px] font-bold text-white transition cursor-pointer text-center"
                >
                  Depart {place.labelThanglish}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Places List */}
        <div className="mt-5">
          <h4 className="text-xs font-bold text-slate-300 mb-2">Saved Designated Locations:</h4>
          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
            {savedPlaces.map((place) => (
              <div
                key={place.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-2.5 text-xs"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white">{place.name}</span>
                    <p className="text-[10px] text-slate-400">
                      {place.latitude}, {place.longitude} • Radius: {place.radius}m
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDeletePlace(place.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    title="Delete place"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Place Form */}
        <form onSubmit={handleAddPlace} className="mt-5 border-t border-slate-800 pt-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-300">Add New Place:</h4>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              required
              value={newPlaceName}
              onChange={(e) => setNewPlaceName(e.target.value)}
              placeholder="Place name (e.g. Clinic, Tuition)"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            />
            <input
              type="text"
              value={newPlaceLabel}
              onChange={(e) => setNewPlaceLabel(e.target.value)}
              placeholder="Thanglish Short Name"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              required
              value={newLat}
              onChange={(e) => setNewLat(e.target.value)}
              placeholder="Latitude"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
            />
            <input
              type="text"
              required
              value={newLng}
              onChange={(e) => setNewLng(e.target.value)}
              placeholder="Longitude"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
            />
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-2 py-2 text-xs font-medium text-cyan-300 transition cursor-pointer"
            >
              {isGettingLocation ? 'Detecting...' : 'Use My GPS'}
            </button>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 py-2.5 text-xs font-bold text-white transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Location</span>
          </button>
        </form>
      </div>
    </div>
  );
};
