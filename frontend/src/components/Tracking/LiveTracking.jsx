import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import SimpleMapComponent from '../Maps/SimpleMapComponent';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  MapPinIcon,
  ClockIcon,
  TruckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const LiveTracking = ({ route, tripId }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [socket, setSocket] = useState(null);
  const simulationInterval = useRef(null);
  const delayTimer = useRef(null);
  const [showDelayNotification, setShowDelayNotification] = useState(false);
  const [delayLocation, setDelayLocation] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Parse waypoints
  const waypoints = route?.waypoints ? 
    (typeof route.waypoints === 'string' ? JSON.parse(route.waypoints) : route.waypoints) 
    : [];

  // Add start and end points to waypoints with proper coordinate validation
  const allStops = [
    {
      name: route?.startPoint || 'Start',
      latitude: parseFloat(route?.startLatitude),
      longitude: parseFloat(route?.startLongitude),
      isStart: true
    },
    ...waypoints.map(wp => ({
      ...wp,
      latitude: parseFloat(wp.latitude),
      longitude: parseFloat(wp.longitude)
    })),
    {
      name: route?.endPoint || 'End',
      latitude: parseFloat(route?.endLatitude),
      longitude: parseFloat(route?.endLongitude),
      isEnd: true
    }
  ].filter(stop => !isNaN(stop.latitude) && !isNaN(stop.longitude));

  // Debug: Log the stops being used
  useEffect(() => {
    console.log('Route data:', route);
    console.log('All stops for tracking:', allStops);
    console.log('Waypoints:', waypoints);
  }, [route, allStops, waypoints]);

  // Function to get real road path using OpenRouteService
  const getRoadPath = async (startCoords, endCoords) => {
    try {
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248b8b4b3b3b4b3b3b3&start=${startCoords[1]},${startCoords[0]}&end=${endCoords[1]},${endCoords[0]}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features[0]) {
          return data.features[0].geometry;
        }
      }
    } catch (error) {
      console.error('Error fetching road path:', error);
    }
    return null;
  };

  // Generate route geometry for all segments
  useEffect(() => {
    const generateRouteGeometry = async () => {
      if (allStops.length < 2) return;

      const routeSegments = [];
      
      for (let i = 0; i < allStops.length - 1; i++) {
        const start = [allStops[i].latitude, allStops[i].longitude];
        const end = [allStops[i + 1].latitude, allStops[i + 1].longitude];
        
        const geometry = await getRoadPath(start, end);
        if (geometry) {
          routeSegments.push(geometry);
        }
      }

      if (routeSegments.length > 0) {
        // Combine all route segments
        const combinedCoordinates = [];
        routeSegments.forEach(segment => {
          if (segment.coordinates) {
            combinedCoordinates.push(...segment.coordinates);
          }
        });

        setRouteGeometry({
          type: "LineString",
          coordinates: combinedCoordinates
        });
      }
    };

    generateRouteGeometry();
  }, [allStops]);

  // Delay detection logic
  useEffect(() => {
    if (currentLocation && isSimulating) {
      // Clear existing timer
      if (delayTimer.current) {
        clearTimeout(delayTimer.current);
      }

      // Set new timer for 2 seconds
      delayTimer.current = setTimeout(() => {
        setShowDelayNotification(true);
        setDelayLocation(currentLocation);
      }, 2000);
    } else {
      // Clear timer if not simulating or no location
      if (delayTimer.current) {
        clearTimeout(delayTimer.current);
        delayTimer.current = null;
      }
      setShowDelayNotification(false);
    }

    // Cleanup on unmount
    return () => {
      if (delayTimer.current) {
        clearTimeout(delayTimer.current);
      }
    };
  }, [currentLocation, isSimulating]);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(API_BASE_URL.replace('/api', ''));
    setSocket(newSocket);

    // Listen for location updates
    newSocket.on('location-update', (data) => {
      if (data.tripId === tripId) {
        setCurrentLocation(data.location);
        setCurrentStopIndex(data.stopIndex || 0);
        setProgress(data.progress || 0);
      }
    });

    // Listen for trip status updates
    newSocket.on('trip-status-update', (data) => {
      if (data.tripId === tripId) {
        setIsTracking(data.status === 'IN_PROGRESS');
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [tripId, API_BASE_URL]);

  const startTracking = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/trips/${tripId}/start-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setIsTracking(true);
        if (socket) {
          socket.emit('join-trip', tripId);
        }
      }
    } catch (error) {
      console.error('Error starting tracking:', error);
    }
  };

  const stopTracking = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/trips/${tripId}/stop-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setIsTracking(false);
        setIsSimulating(false);
        if (simulationInterval.current) {
          clearInterval(simulationInterval.current);
        }
        if (socket) {
          socket.emit('leave-trip', tripId);
        }
      }
    } catch (error) {
      console.error('Error stopping tracking:', error);
    }
  };

  const resetToStart = () => {
    setIsSimulating(false);
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
    }
    if (delayTimer.current) {
      clearTimeout(delayTimer.current);
      delayTimer.current = null;
    }
    setShowDelayNotification(false);
    setCurrentLocation(null);
    setCurrentStopIndex(0);
    setProgress(0);
    setIsMoving(false);
    toast.info('Reset to start position');
  };

  const simulateMovement = () => {
    if (isSimulating) {
      // Stop simulation but keep current location
      setIsSimulating(false);
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
      // Clear delay timer when stopping
      if (delayTimer.current) {
        clearTimeout(delayTimer.current);
        delayTimer.current = null;
      }
      setShowDelayNotification(false);
      return;
    }

    if (allStops.length < 2) {
      toast.error('Route needs at least 2 stops for simulation');
      return;
    }

    setIsSimulating(true);
    
    // Continue from current location if available, otherwise start from beginning
    let currentIndex = currentStopIndex;
    let currentProgress = progress;
    
    // If no current location, start from the first stop
    if (!currentLocation) {
      currentIndex = 0;
      currentProgress = 0;
      setCurrentLocation({
        latitude: allStops[0].latitude,
        longitude: allStops[0].longitude,
        timestamp: new Date().toISOString()
      });
      setCurrentStopIndex(0);
      setProgress(0);
    }

    simulationInterval.current = setInterval(() => {
      if (currentIndex < allStops.length - 1) {
        const currentStop = allStops[currentIndex];
        const nextStop = allStops[currentIndex + 1];

        // Use road path if available, otherwise use direct line
        let newLat, newLng;
        
        if (routeGeometry && routeGeometry.coordinates) {
          // Find the closest point on the road path
          const totalPoints = routeGeometry.coordinates.length;
          const segmentStart = Math.floor((currentIndex / (allStops.length - 1)) * totalPoints);
          const segmentEnd = Math.floor(((currentIndex + 1) / (allStops.length - 1)) * totalPoints);
          const segmentLength = segmentEnd - segmentStart;
          const pointIndex = segmentStart + Math.floor((segmentLength * currentProgress) / 100);
          
          if (pointIndex < totalPoints) {
            const roadPoint = routeGeometry.coordinates[pointIndex];
            newLng = roadPoint[0]; // OpenRouteService returns [lng, lat]
            newLat = roadPoint[1];
          } else {
            // Fallback to direct line calculation
            const latDiff = nextStop.latitude - currentStop.latitude;
            const lngDiff = nextStop.longitude - currentStop.longitude;
            newLat = currentStop.latitude + (latDiff * currentProgress / 100);
            newLng = currentStop.longitude + (lngDiff * currentProgress / 100);
          }
        } else {
          // Direct line calculation as fallback
          const latDiff = nextStop.latitude - currentStop.latitude;
          const lngDiff = nextStop.longitude - currentStop.longitude;
          newLat = currentStop.latitude + (latDiff * currentProgress / 100);
          newLng = currentStop.longitude + (lngDiff * currentProgress / 100);
        }

        const newLocation = {
          latitude: parseFloat(newLat.toFixed(6)),
          longitude: parseFloat(newLng.toFixed(6)),
          timestamp: new Date().toISOString()
        };

        setCurrentLocation(newLocation);
        setCurrentStopIndex(currentIndex);
        setProgress(currentProgress);
        setIsMoving(true); // Bus is moving

        // Emit location update
        if (socket) {
          socket.emit('location-update', {
            tripId,
            location: newLocation,
            stopIndex: currentIndex,
            progress: currentProgress
          });
        }

        currentProgress += 2; // Move 2% every interval for smoother simulation

        if (currentProgress >= 100) {
          currentProgress = 0;
          currentIndex++;

          // If we've reached the next stop, set exact coordinates and pause briefly
          if (currentIndex < allStops.length) {
            setCurrentLocation({
              latitude: allStops[currentIndex].latitude,
              longitude: allStops[currentIndex].longitude,
              timestamp: new Date().toISOString()
            });
            setCurrentStopIndex(currentIndex);
            setProgress(0);
            setIsMoving(false); // Bus is stopped at station
            
            // Brief pause at station (simulate boarding/alighting)
            setTimeout(() => {
              setIsMoving(true);
            }, 2000);
          }
        }
      } else {
        // Trip completed - set to final stop
        setIsSimulating(false);
        clearInterval(simulationInterval.current);
        setCurrentStopIndex(allStops.length - 1);
        setProgress(100);
        setIsMoving(false); // Bus has arrived
        setCurrentLocation({
          latitude: allStops[allStops.length - 1].latitude,
          longitude: allStops[allStops.length - 1].longitude,
          timestamp: new Date().toISOString()
        });
      }
    }, 1000); // Update every 1000ms for more realistic movement
  };

  const getCurrentStop = () => {
    if (currentStopIndex < allStops.length) {
      return allStops[currentStopIndex];
    }
    return allStops[allStops.length - 1];
  };

  const getNextStop = () => {
    if (currentStopIndex < allStops.length - 1) {
      return allStops[currentStopIndex + 1];
    }
    return null;
  };

  const getOverallProgress = () => {
    if (allStops.length === 0) return 0;
    const completedStops = currentStopIndex;
    const currentStopProgress = progress / 100;
    const totalProgress = (completedStops + currentStopProgress) / (allStops.length - 1);
    return Math.min(totalProgress * 100, 100);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Live Tracking Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {isTracking ? 'LIVE TRACKING' : 'TRACKING STOPPED'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <TruckIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Bus KA-01</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isMoving ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {isMoving ? 'Moving • En Route' : 'Stopped at Station'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={isTracking ? stopTracking : startTracking}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isTracking 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isTracking ? (
                <>
                  <StopIcon className="h-4 w-4 inline mr-1" />
                  Stop Tracking
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4 inline mr-1" />
                  Start Tracking
                </>
              )}
            </button>

            <button
              onClick={simulateMovement}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isSimulating 
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {isSimulating ? (
                <>
                  <PauseIcon className="h-4 w-4 inline mr-1" />
                  Stop Simulation
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4 inline mr-1" />
                  Simulate
                </>
              )}
            </button>

            <button
              onClick={resetToStart}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              title="Reset to start position"
            >
              <ArrowPathIcon className="h-4 w-4 inline mr-1" />
              Reset
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Stop {currentStopIndex + 1} of {allStops.length}</span>
            <span>{Math.round(getOverallProgress())}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 relative">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getOverallProgress()}%` }}
            ></div>
            {/* Current position indicator */}
            <div 
              className="absolute top-0 w-1 h-2 bg-orange-500 rounded-full transform -translate-x-0.5"
              style={{ left: `${getOverallProgress()}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            {allStops.map((stop, index) => (
              <span 
                key={index}
                className={`${
                  index < currentStopIndex 
                    ? 'text-green-600 font-medium' 
                    : index === currentStopIndex 
                    ? 'text-blue-600 font-bold' 
                    : 'text-gray-400'
                }`}
                title={`${stop.name} (${stop.latitude.toFixed(4)}, ${stop.longitude.toFixed(4)})`}
              >
                {stop.name.length > 15 ? stop.name.substring(0, 15) + '...' : stop.name}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* Map Section */}
      <div className="flex-1 relative">
        <SimpleMapComponent
          startLat={route?.startLatitude}
          startLng={route?.startLongitude}
          endLat={route?.endLatitude}
          endLng={route?.endLongitude}
          waypoints={waypoints}
          routePath={routeGeometry || (route?.routePath ? 
            (typeof route.routePath === 'string' ? JSON.parse(route.routePath) : route.routePath) 
            : null)}
          currentLocation={currentLocation}
          height="100%"
          width="100%"
        />
      </div>

      {/* Current Location Info */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <MapPinIcon className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Current Location</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {getCurrentStop()?.name || 'Unknown'}
              </p>
              {getNextStop() && (
                <p className="text-xs text-gray-500">
                  Next: {getNextStop().name}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-4 w-4" />
              <span>ETA: {getNextStop() ? '15 min' : 'Arrived'}</span>
            </div>
            {currentLocation && (
              <div className="text-xs text-gray-500">
                📍 {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </div>
            )}
          </div>
        </div>
        
        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
            <div className="font-medium text-gray-700 mb-1">Debug Info:</div>
            <div>Total Stops: {allStops.length}</div>
            <div>Current Stop Index: {currentStopIndex}</div>
            <div>Current Stop Progress: {progress.toFixed(1)}%</div>
            <div>Overall Progress: {getOverallProgress().toFixed(1)}%</div>
            <div>Current Stop: {getCurrentStop()?.name || 'Unknown'}</div>
            <div>Next Stop: {getNextStop()?.name || 'Destination'}</div>
            {currentLocation && (
              <div>Live Coordinates: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}</div>
            )}
          </div>
        )}
      </div>

      {/* Delay Notification */}
      {showDelayNotification && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <div>
              <div className="font-semibold">🚨 Bus Delay Alert</div>
              <div className="text-sm">Bus has been stopped for more than 2 seconds</div>
              <div className="text-sm font-medium">Estimated delay: 5 minutes</div>
              {delayLocation && (
                <div className="text-xs text-red-600 mt-1">
                  📍 {delayLocation.latitude.toFixed(4)}, {delayLocation.longitude.toFixed(4)}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowDelayNotification(false)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTracking;
