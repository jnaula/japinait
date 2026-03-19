import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, LocateFixed } from 'lucide-react';
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

// Geocoder independiente usando la API REST — no depende del ciclo de vida de React
async function reverseGeocode(lat, lng) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === 'OK' && data.results[0]) {
    return data.results[0].formatted_address;
  }
  return null;
}

function MapContent({ center, onLocationChange, onAddressChange }) {
  const [markerPos, setMarkerPos] = useState(center);

  useEffect(() => {
    setMarkerPos(center);
  }, [center.lat, center.lng]);

  const handlePositionChange = async (lat, lng) => {
    setMarkerPos({ lat, lng });
    onLocationChange(lat, lng);
    const address = await reverseGeocode(lat, lng);
    if (address) onAddressChange(address);
  };

  const handleDragEnd = (e) => {
    if (e.latLng) {
      handlePositionChange(e.latLng.lat(), e.latLng.lng());
    }
  };

  const handleMapClick = (e) => {
    if (e.detail?.latLng) {
      handlePositionChange(e.detail.latLng.lat, e.detail.latLng.lng);
    }
  };

  return (
    <Map
      defaultZoom={15}
      defaultCenter={center}
      gestureHandling="greedy"
      mapId="nerd-map"
      options={{
        styles: darkMapStyle,
        streetViewControl: false,
        mapTypeControl: false,
      }}
      onClick={handleMapClick}
      className="w-full h-full"
    >
      <AdvancedMarker
        position={markerPos}
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
  const defaultCenter = { lat: -0.1807, lng: -78.4678 };
  const [center, setCenter] = useState(
    location ? { lat: parseFloat(location.lat), lng: parseFloat(location.lng) } : defaultCenter
  );
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);

  useEffect(() => {
    if (location) {
      setCenter({ lat: parseFloat(location.lat), lng: parseFloat(location.lng) });
    }
  }, [location]);

  const handleLocateMe = () => {
    setGeoError(null);

    if (!navigator.geolocation) {
      setGeoError('Tu navegador no soporta geolocalización.');
      return;
    }

    // Fix: usar window.location, no el prop location
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setGeoError('La geolocalización requiere HTTPS. Contacta al administrador.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCenter({ lat: latitude, lng: longitude });
        onLocationChange(latitude, longitude);

        // Geocoding inmediato al detectar ubicación
        const address = await reverseGeocode(latitude, longitude);
        if (address) onAddressChange(address);

        setLocating(false);
      },
      (err) => {
        const messages = {
          1: 'Permiso denegado. Actívalo en configuración del navegador.',
          2: 'No se pudo obtener la ubicación.',
          3: 'Tiempo de espera agotado.',
        };
        setGeoError(messages[err.code] || 'Error desconocido.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleLocationChange = (lat, lng) => {
    setCenter({ lat, lng });
    onLocationChange(lat, lng);
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <MapPin className="w-4 h-4" />
          <span>Selecciona la ubicación en el mapa</span>
        </div>
        <button
          onClick={handleLocateMe}
          disabled={locating}
          className="flex items-center space-x-1 text-xs text-[#ff0080] hover:text-[#ff40a0] disabled:opacity-50 transition-colors"
        >
          {locating
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <LocateFixed className="w-3 h-3" />
          }
          <span>{locating ? 'Localizando...' : 'Mi ubicación'}</span>
        </button>
      </div>

      {geoError && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
          {geoError}
        </div>
      )}

      <div className="w-full h-64 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <MapContent
            center={center}
            onLocationChange={handleLocationChange}
            onAddressChange={onAddressChange}
          />
        </APIProvider>
      </div>
      <div className="text-xs text-gray-500">
        Haz clic en el mapa o arrastra el marcador para ajustar la ubicación.
      </div>
    </div>
  );
}