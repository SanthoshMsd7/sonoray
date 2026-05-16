'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in leaflet with nextjs
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

export interface LocationData {
  id: string;
  lat: number | null;
  lng: number | null;
  isOnDuty?: boolean;
  isStale?: boolean;
  batteryLevel?: number | null;
  address?: string | null;
  timestamp?: string | null;
}

interface MapComponentProps {
  locations: LocationData[];
  center?: [number, number];
  zoom?: number;
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapComponent({ locations, center = [0, 0], zoom = 2 }: MapComponentProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Auto-center based on first location if default is used
  const validLocations = locations.filter(l => l.lat !== null && l.lng !== null);
  const mapCenter: [number, number] = validLocations.length > 0 && center[0] === 0 ? [validLocations[0].lat!, validLocations[0].lng!] : center;
  const mapZoom = locations.length > 0 && zoom === 2 ? 14 : zoom;

  if (!mounted) return <div style={{ height: '100%', width: '100%', background: '#f1f5f9' }} />;

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer 
        key={mounted ? 'map-mounted' : 'map-unmounted'}
        center={mapCenter} 
        zoom={mapZoom} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <ChangeView center={mapCenter} zoom={mapZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.filter(l => l.lat !== null && l.lng !== null).map((loc) => {
          const redIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });

          return (
            <Marker 
              key={loc.id} 
              position={[loc.lat!, loc.lng!]} 
              icon={loc.isStale ? redIcon : new L.Icon.Default()}
            >
            <Popup>
              <div className="p-1">
                <p className="font-bold text-slate-800">{loc.name}</p>
                {loc.address && <p className="text-xs text-slate-500 mt-1">{loc.address}</p>}
                <div className="flex items-center gap-4 mt-2 border-t pt-2 border-slate-100">
                  {loc.batteryLevel !== undefined && (
                    <span className="text-[10px] font-bold text-slate-400">🔋 {loc.batteryLevel}%</span>
                  )}
                  {loc.timestamp && (
                    <span className="text-[10px] font-bold text-slate-400">🕒 {new Date(loc.timestamp).toLocaleTimeString()}</span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
