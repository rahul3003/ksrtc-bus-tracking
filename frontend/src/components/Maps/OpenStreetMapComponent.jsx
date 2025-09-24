import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const OpenStreetMapComponent = ({ center, zoom, busLocations, busStops, routeWaypoints, routePath, className }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routeLineRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView(
      center || [12.9716, 77.5946], // Default to Bangalore
      zoom || 12
    );

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear existing markers and route line
    markersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    markersRef.current = [];

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    // Add route path and waypoints if provided
    if (routePath && routePath.coordinates) {
      // Use real route path coordinates
      const routeCoordinates = routePath.coordinates.map(coord => [coord.longitude, coord.latitude]);
      const routeLine = L.polyline(routeCoordinates, {
        color: '#3B82F6',
        weight: 4,
        opacity: 0.8,
        smoothFactor: 1
      }).addTo(map);
      routeLineRef.current = routeLine;
    } else if (routeWaypoints && routeWaypoints.length > 0) {
      // Fallback to waypoints if no route path
      const routeCoordinates = routeWaypoints.map(waypoint => [waypoint.latitude, waypoint.longitude]);
      const routeLine = L.polyline(routeCoordinates, {
        color: '#3B82F6',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10'
      }).addTo(map);
      routeLineRef.current = routeLine;
    }

    // Add waypoint markers if provided
    if (routeWaypoints && routeWaypoints.length > 0) {
      routeWaypoints.forEach((waypoint, index) => {
        const position = [waypoint.latitude, waypoint.longitude];
        
        const waypointIcon = L.divIcon({
          className: 'custom-waypoint-marker',
          html: `
            <div style="
              background: ${index === 0 ? '#10B981' : index === routeWaypoints.length - 1 ? '#EF4444' : '#F59E0B'};
              color: white;
              border-radius: 50%;
              width: 24px;
              height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              font-weight: bold;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
              ${index === 0 ? 'S' : index === routeWaypoints.length - 1 ? 'E' : index}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(position, { icon: waypointIcon }).addTo(map);
        marker.bindPopup(`
          <div style="padding: 8px;">
            <h4 style="margin: 0 0 4px 0; color: #333; font-size: 14px;">
              ${waypoint.name}
            </h4>
            <p style="margin: 0; color: #666; font-size: 12px;">
              ${index === 0 ? 'Start Point' : index === routeWaypoints.length - 1 ? 'End Point' : 'Bus Stop'}
            </p>
            ${waypoint.stopTime > 0 && (
              `<p style="margin: 4px 0 0 0; color: #999; font-size: 11px;">
                Stop Time: ${waypoint.stopTime / 1000}s
              </p>`
            )}
          </div>
        `);
        markersRef.current.push(marker);
      });
    }

    // Add bus markers
    busLocations.forEach(bus => {
      const position = [bus.latitude, bus.longitude];
      
      // Create custom bus icon
      const busIcon = L.divIcon({
        className: 'custom-bus-marker',
        html: `
          <div style="
            background: #4285F4;
            color: white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            transform: rotate(${bus.heading || 0}deg);
          ">
            🚌
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker(position, { icon: busIcon }).addTo(map);

      // Add popup with bus information
      const popupContent = `
        <div style="padding: 8px; min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: bold;">
            Bus: ${bus.busNumber}
          </h4>
          <p style="margin: 2px 0; color: #666; font-size: 12px;">
            <strong>Route:</strong> ${bus.routeName}
          </p>
          <p style="margin: 2px 0; color: #666; font-size: 12px;">
            <strong>Driver:</strong> ${bus.driverName}
          </p>
          <p style="margin: 2px 0; color: #666; font-size: 12px;">
            <strong>Speed:</strong> ${bus.speed ? bus.speed.toFixed(2) + ' km/h' : 'N/A'}
          </p>
          <p style="margin: 2px 0; color: #666; font-size: 12px;">
            <strong>Status:</strong> ${bus.status}
          </p>
          <p style="margin: 2px 0; color: #999; font-size: 11px;">
            Last Update: ${new Date(bus.timestamp).toLocaleTimeString()}
          </p>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
    });

    // Add bus stop markers
    busStops.forEach(stop => {
      const position = [stop.latitude, stop.longitude];
      
      const stopIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: `
          <div style="
            background: #FF6B6B;
            color: white;
            border-radius: 4px;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            🚏
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker(position, { icon: stopIcon }).addTo(map);
      marker.bindPopup(`
        <div style="padding: 8px;">
          <h4 style="margin: 0 0 4px 0; color: #333; font-size: 14px;">
            ${stop.name}
          </h4>
          <p style="margin: 0; color: #666; font-size: 12px;">
            ${stop.description || 'Bus Stop'}
          </p>
        </div>
      `);
      markersRef.current.push(marker);
    });

    // Fit map to show all markers and route
    if (busLocations.length > 0 || busStops.length > 0 || (routeWaypoints && routeWaypoints.length > 0)) {
      const allLayers = [...markersRef.current];
      if (routeLineRef.current) {
        allLayers.push(routeLineRef.current);
      }
      const group = new L.featureGroup(allLayers);
      map.fitBounds(group.getBounds().pad(0.1));
    } else if (center) {
      map.setView(center, zoom || 12);
    }

  }, [busLocations, busStops, routeWaypoints, routePath, center, zoom]);

  return (
    <div 
      ref={mapRef} 
      className={className || "h-full w-full"} 
      style={{ 
        minHeight: '300px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}
    />
  );
};

export default OpenStreetMapComponent;
