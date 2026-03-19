import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, useMapsLibrary } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBBy7nFUipYZ1FDegs-SsgZ9d7ViAZqInI';

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
];

function MapContent({ center, onLocationChange, onAddressChange }) {
  const geocodingLib = useMapsLibrary('geocoding');
  const [geocoder, setGeocoder] = useState(null);

  useEffect(() => {
    if (!geocodingLib) return;
    setGeocoder(new geocodingLib.Geocoder());
  }, [geocodingLib]);

  const updateAddress = (lat, lng) => {
    if (!geocoder || !onAddressChange) return;
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        onAddressChange(results[0].formatted_address);
      }
    });
  };

  const handleDragEnd = (e) => {
    if (e.latLng) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      onLocationChange(newLat, newLng);
      updateAddress(newLat, newLng);
    }
  };

  const handleMapClick = (e) => {
    if (e.detail.latLng) {
      const newLat = e.detail.latLng.lat;
      const newLng = e.detail.latLng.lng;
      onLocationChange(newLat, newLng);
      updateAddress(newLat, newLng);
    }
  };

  return (
    <Map
      defaultZoom={13}
      center={center}
      mapId="nerd-picker-map"
      options={{
        styles: darkMapStyle,
        streetViewControl: false,
        mapTypeControl: false,
        draggableCursor: 'pointer',
      }}
      onClick={handleMapClick}
      className="w-full h-full"
    >
      <AdvancedMarker
        position={center}
        draggable={true}
        onDragEnd={handleDragEnd}
      >
        <div className="w-6 h-6 bg-[#ff0080] rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      </AdvancedMarker>
    </Map>
  );
}

export default function MapPicker({ location, onLocationChange, onAddressChange }) {
  // Default to Quito, Ecuador if no location provided
  const defaultCenter = { lat: -0.1807, lng: -78.4678 };
  const center = location ? { lat: parseFloat(location.lat), lng: parseFloat(location.lng) } : defaultCenter;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center space-x-2 text-sm text-gray-400">
        <MapPin className="w-4 h-4" />
        <span>Selecciona la ubicación en el mapa</span>
      </div>
      <div className="w-full h-64 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <MapContent 
            center={center} 
            onLocationChange={onLocationChange}
            onAddressChange={onAddressChange}
          />
        </APIProvider>
      </div>
      <div className="text-xs text-gray-500">
        Haz clic en el mapa o arrastra el marcador para ajustar la ubicación. La dirección se actualizará automáticamente.
      </div>
    </div>
  );
}