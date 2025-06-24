import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Loader2 } from 'lucide-react';

// Fix for default icon issue with webpack
interface IconDefault extends L.Icon.Default {
  _getIconUrl?: string;
}
delete (L.Icon.Default.prototype as IconDefault)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Define the type for a map location
export type MapLocation = {
  name: string;
  description: string;
  lat: number;
  lng: number;
};

interface ItineraryMapProps {
  locations: MapLocation[];
  isLoading?: boolean;
  error?: string;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_STYLE = 'mapbox/streets-v11';

const ItineraryMap: React.FC<ItineraryMapProps> = ({ locations, isLoading, error }) => {
  // Use the first location as the initial center, or a default
  const initialCenter: [number, number] =
    locations.length > 0
      ? [locations[0].lat, locations[0].lng]
      : [51.505, -0.09]; // Default to London if no locations

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-4">
          <div className="text-red-500 text-lg mb-2">⚠️ Error loading map</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500 mx-auto mb-2" />
          <div className="text-gray-600">Loading map locations...</div>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-4">
          <div className="text-gray-500 text-lg mb-2">📍 No locations to display</div>
          <div className="text-gray-600">Add some activities to see them on the map</div>
        </div>
      </div>
    );
  }

  return (
    <MapContainer 
      center={initialCenter} 
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg shadow-lg"
    >
      <TileLayer
        url={`https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`}
        attribution='© Mapbox © OpenStreetMap'
        tileSize={512}
        zoomOffset={-1}
      />
      {locations.map((location, idx) => (
        <Marker key={idx} position={[location.lat, location.lng]}>
          <Popup>
            <div className="p-2">
              <div className="font-bold text-lg mb-1">{location.name}</div>
              <p className="text-gray-600 text-sm">{location.description}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default ItineraryMap; 