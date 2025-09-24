import { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';

const render = (status) => {
  switch (status) {
    case Status.LOADING:
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    case Status.FAILURE:
      return (
        <div className="flex items-center justify-center h-full text-red-600">
          <p>Failed to load Google Maps</p>
        </div>
      );
    default:
      return null;
  }
};

const GoogleMapComponent = ({ 
  center = { lat: 12.9716, lng: 77.5946 }, // Bangalore coordinates
  zoom = 12,
  busLocations = [],
  busStops = [],
  onMapClick,
  className = "h-96 w-full"
}) => {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [busMarkers, setBusMarkers] = useState([]);
  const [stopMarkers, setStopMarkers] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current && !map) {
      const newMap = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      setMap(newMap);

      // Add click listener if provided
      if (onMapClick) {
        newMap.addListener('click', onMapClick);
      }
    }
  }, [center, zoom, onMapClick]);

  // Update bus markers when bus locations change
  useEffect(() => {
    if (!map) return;

    // Clear existing bus markers
    busMarkers.forEach(marker => marker.setMap(null));

    const newBusMarkers = busLocations.map((bus, index) => {
      const marker = new window.google.maps.Marker({
        position: { lat: bus.latitude, lng: bus.longitude },
        map,
        title: `Bus: ${bus.busNumber}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#3B82F6" stroke="#1E40AF" stroke-width="2"/>
              <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🚌</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16)
        },
        animation: window.google.maps.Animation.DROP
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-bold text-lg">${bus.busNumber}</h3>
            <p class="text-sm text-gray-600">Route: ${bus.routeName}</p>
            <p class="text-sm text-gray-600">Driver: ${bus.driverName}</p>
            <p class="text-sm text-gray-600">Speed: ${bus.speed ? Math.round(bus.speed) + ' km/h' : 'N/A'}</p>
            <p class="text-sm text-gray-600">Status: ${bus.status}</p>
            <p class="text-xs text-gray-500">Last Update: ${new Date(bus.timestamp).toLocaleTimeString()}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setBusMarkers(newBusMarkers);
  }, [map, busLocations]);

  // Update bus stop markers
  useEffect(() => {
    if (!map) return;

    // Clear existing stop markers
    stopMarkers.forEach(marker => marker.setMap(null));

    const newStopMarkers = busStops.map((stop, index) => {
      const marker = new window.google.maps.Marker({
        position: { lat: stop.latitude, lng: stop.longitude },
        map,
        title: stop.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="#10B981" stroke="#059669" stroke-width="2"/>
              <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">📍</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(24, 24),
          anchor: new window.google.maps.Point(12, 12)
        }
      });

      // Add info window for stops
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-bold">${stop.name}</h3>
            <p class="text-sm text-gray-600">${stop.address || 'Bus Stop'}</p>
            ${stop.eta ? `<p class="text-sm text-blue-600">ETA: ${stop.eta}</p>` : ''}
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setStopMarkers(newStopMarkers);
  }, [map, busStops]);

  // Fit map to show all markers
  useEffect(() => {
    if (!map || (busLocations.length === 0 && busStops.length === 0)) return;

    const bounds = new window.google.maps.LatLngBounds();
    
    busLocations.forEach(bus => {
      bounds.extend({ lat: bus.latitude, lng: bus.longitude });
    });
    
    busStops.forEach(stop => {
      bounds.extend({ lat: stop.latitude, lng: stop.longitude });
    });

    if (busLocations.length > 0 || busStops.length > 0) {
      map.fitBounds(bounds);
    }
  }, [map, busLocations, busStops]);

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  );
};

const GoogleMapWrapper = (props) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Google Maps API Key Required</p>
          <p className="text-sm text-gray-500">
            Please add VITE_GOOGLE_MAPS_API_KEY to your .env file
          </p>
        </div>
      </div>
    );
  }

  return (
    <Wrapper apiKey={apiKey} render={render}>
      <GoogleMapComponent {...props} />
    </Wrapper>
  );
};

export default GoogleMapWrapper;
