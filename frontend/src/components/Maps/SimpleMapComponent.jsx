import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom bus icon
const createBusIcon = (color = 'blue') => {
  return L.divIcon({
    className: 'custom-bus-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        font-weight: bold;
      ">
        🚌
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// Custom start/end icons
const createStopIcon = (type) => {
  const colors = {
    start: '#10B981', // green
    end: '#EF4444',   // red
    waypoint: '#3B82F6' // blue
  };
  
  return L.divIcon({
    className: 'custom-stop-icon',
    html: `
      <div style="
        background-color: ${colors[type] || colors.waypoint};
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

// Component to handle map updates
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.length === 2) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  
  return null;
};

const SimpleMapComponent = ({
  startLat,
  startLng,
  endLat,
  endLng,
  waypoints = [],
  routePath = null,
  currentLocation = null,
  height = '400px',
  width = '100%'
}) => {
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Default to Bangalore
  const [mapZoom, setMapZoom] = useState(8);

  // Calculate map center and zoom based on route
  useEffect(() => {
    const coordinates = [];
    
    if (startLat && startLng) coordinates.push([startLat, startLng]);
    if (endLat && endLng) coordinates.push([endLat, endLng]);
    waypoints.forEach(wp => {
      if (wp.latitude && wp.longitude) {
        coordinates.push([wp.latitude, wp.longitude]);
      }
    });
    
    if (coordinates.length > 0) {
      // Calculate center
      const avgLat = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
      const avgLng = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
      setMapCenter([avgLat, avgLng]);
      
      // Calculate appropriate zoom level
      if (coordinates.length === 1) {
        setMapZoom(12);
      } else if (coordinates.length === 2) {
        setMapZoom(8);
      } else {
        setMapZoom(7);
      }
    }
  }, [startLat, startLng, endLat, endLng, waypoints]);

  // Prepare route coordinates for polyline
  const routeCoordinates = [];
  if (routePath && routePath.coordinates) {
    routeCoordinates.push(...routePath.coordinates.map(coord => [coord.latitude, coord.longitude]));
  } else {
    // Fallback: create simple route from start to end via waypoints
    if (startLat && startLng) routeCoordinates.push([startLat, startLng]);
    waypoints.forEach(wp => {
      if (wp.latitude && wp.longitude) {
        routeCoordinates.push([wp.latitude, wp.longitude]);
      }
    });
    if (endLat && endLng) routeCoordinates.push([endLat, endLng]);
  }

  return (
    <div style={{ height, width }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route polyline */}
        {routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            color="#3B82F6"
            weight={4}
            opacity={0.8}
          />
        )}

        {/* Start marker */}
        {startLat && startLng && (
          <Marker
            position={[startLat, startLng]}
            icon={createStopIcon('start')}
          >
            <Popup>
              <div className="text-center">
                <div className="font-semibold text-green-600">START</div>
                <div className="text-sm">📍 {startLat.toFixed(4)}, {startLng.toFixed(4)}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Waypoint markers */}
        {waypoints.map((waypoint, index) => (
          waypoint.latitude && waypoint.longitude && (
            <Marker
              key={index}
              position={[waypoint.latitude, waypoint.longitude]}
              icon={createStopIcon('waypoint')}
            >
              <Popup>
                <div className="text-center">
                  <div className="font-semibold text-blue-600">Stop {index + 1}</div>
                  <div className="text-sm font-medium">{waypoint.name}</div>
                  {(waypoint.district || waypoint.taluk) && (
                    <div className="text-xs text-gray-500">
                      {waypoint.district && waypoint.taluk 
                        ? `${waypoint.taluk}, ${waypoint.district}`
                        : waypoint.district || waypoint.taluk
                      }
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    📍 {waypoint.latitude.toFixed(4)}, {waypoint.longitude.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* End marker */}
        {endLat && endLng && (
          <Marker
            position={[endLat, endLng]}
            icon={createStopIcon('end')}
          >
            <Popup>
              <div className="text-center">
                <div className="font-semibold text-red-600">END</div>
                <div className="text-sm">📍 {endLat.toFixed(4)}, {endLng.toFixed(4)}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Current location marker (bus) */}
        {currentLocation && currentLocation.latitude && currentLocation.longitude && (
          <Marker
            position={[currentLocation.latitude, currentLocation.longitude]}
            icon={createBusIcon('orange')}
          >
            <Popup>
              <div className="text-center">
                <div className="font-semibold text-orange-600">🚌 BUS LOCATION</div>
                <div className="text-sm">Live Position</div>
                <div className="text-xs text-gray-400">
                  📍 {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                </div>
                {currentLocation.timestamp && (
                  <div className="text-xs text-gray-400">
                    🕒 {new Date(currentLocation.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default SimpleMapComponent;
