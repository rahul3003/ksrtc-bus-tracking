import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import OpenStreetMapComponent from '../../components/Maps/OpenStreetMapComponent';
import busMovementService from '../../services/busMovementService';
import {
  MapIcon,
  TruckIcon,
  PlusIcon,
  ArrowPathIcon,
  MapPinIcon,
  ClockIcon,
  ChartBarIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline';

const LiveTracking = () => {
  const [activeBuses, setActiveBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingSampleData, setCreatingSampleData] = useState(false);
  const [generatingFullSampleData, setGeneratingFullSampleData] = useState(false);
  const [routeWaypoints, setRouteWaypoints] = useState([]);
  const [simulatedBuses, setSimulatedBuses] = useState(new Map());
  const { user } = useAuth();

  // Debug: Log user info
  console.log('LiveTracking - Current user:', user);
  console.log('LiveTracking - User role:', user?.role);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (user?.id) {
      fetchActiveBuses();
      loadRouteWaypoints();
    }
  }, [user]);

  // Cleanup simulations on unmount
  useEffect(() => {
    return () => {
      simulatedBuses.forEach((_, tripId) => {
        busMovementService.stopSimulation(tripId);
      });
    };
  }, []);

  const fetchActiveBuses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/locations/active-buses`);
      setActiveBuses(response.data.activeBuses);
    } catch (error) {
      console.error('Error fetching active buses:', error);
      toast.error('Failed to fetch active buses');
    } finally {
      setLoading(false);
    }
  };

  const loadRouteWaypoints = async () => {
    try {
      // For demo purposes, we'll use predefined waypoints
      const waypoints = [
        { name: "City Center", latitude: 12.9716, longitude: 77.5946, stopTime: 0 },
        { name: "Mall Road", latitude: 12.9750, longitude: 77.6000, stopTime: 30000 },
        { name: "Airport Terminal", latitude: 12.9780, longitude: 77.6050, stopTime: 30000 },
        { name: "Railway Station", latitude: 12.9810, longitude: 77.6100, stopTime: 30000 },
        { name: "University", latitude: 12.9840, longitude: 77.6150, stopTime: 30000 },
        { name: "Hospital", latitude: 12.9870, longitude: 77.6200, stopTime: 30000 },
        { name: "Final Stop", latitude: 12.9900, longitude: 77.6250, stopTime: 0 }
      ];
      setRouteWaypoints(waypoints);
    } catch (error) {
      console.error('Error loading route waypoints:', error);
    }
  };

  const createSampleData = async () => {
    try {
      setCreatingSampleData(true);
      const response = await axios.post(`${API_BASE_URL}/locations/create-sample-data`);
      toast.success('Sample location data created successfully!');
      await fetchActiveBuses(); // Refresh the list
    } catch (error) {
      console.error('Error creating sample data:', error);
      toast.error('Failed to create sample data');
    } finally {
      setCreatingSampleData(false);
    }
  };

  const generateFullSampleData = async () => {
    try {
      setGeneratingFullSampleData(true);
      const response = await axios.post(`${API_BASE_URL}/locations/generate-sample-data`);
      toast.success('Comprehensive sample data generated successfully!');
      await fetchActiveBuses(); // Refresh the list
    } catch (error) {
      console.error('Error generating full sample data:', error);
      toast.error('Failed to generate sample data');
    } finally {
      setGeneratingFullSampleData(false);
    }
  };

  const startBusSimulation = async (tripId, busData) => {
    if (busMovementService.isSimulationRunning(tripId)) {
      toast.error('Simulation already running for this bus');
      return;
    }

    try {
      // Get route waypoints for this specific trip
      const waypointsResponse = await axios.get(`${API_BASE_URL}/locations/route-waypoints/${tripId}`);
      const tripWaypoints = waypointsResponse.data.waypoints;

      if (!tripWaypoints || tripWaypoints.length === 0) {
        toast.error('No route waypoints found for this trip');
        return;
      }

      // Start the simulation with trip-specific waypoints
      busMovementService.startSimulation(tripId, tripWaypoints, (locationUpdate) => {
        console.log(`🎯 Received location update for trip ${tripId}:`, locationUpdate);
        
        // Update simulated bus position
        setSimulatedBuses(prev => {
          const newMap = new Map(prev);
          newMap.set(tripId, {
            ...busData,
            currentLocation: {
              latitude: locationUpdate.latitude,
              longitude: locationUpdate.longitude,
              speed: locationUpdate.speed,
              heading: locationUpdate.heading,
              timestamp: locationUpdate.timestamp
            }
          });
          console.log(`🗺️ Updated simulated buses map for trip ${tripId}`);
          return newMap;
        });
      });

      toast.success(`Bus ${busData.busNumber} simulation started!`);
    } catch (error) {
      console.error('Error starting bus simulation:', error);
      toast.error('Failed to start bus simulation');
    }
  };

  const stopBusSimulation = (tripId) => {
    busMovementService.stopSimulation(tripId);
    setSimulatedBuses(prev => {
      const newMap = new Map(prev);
      newMap.delete(tripId);
      return newMap;
    });
    toast.success('Bus simulation stopped!');
  };

  const formatSpeed = (speed) => {
    return speed ? `${Math.round(speed)} km/h` : 'N/A';
  };

  const formatHeading = (heading) => {
    if (heading === null || heading === undefined) return 'N/A';
    
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return `${Math.round(heading)}° ${directions[index]}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <p><strong>Debug:</strong> LiveTracking component loaded. User role: {user?.role}</p>
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Bus Tracking</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor all active buses in real-time
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={generateFullSampleData}
            disabled={generatingFullSampleData}
            className="btn-primary flex items-center"
          >
            {generatingFullSampleData ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <PlusIcon className="h-4 w-4 mr-2" />
            )}
            Generate Full Sample Data
          </button>
          <button
            onClick={createSampleData}
            disabled={creatingSampleData}
            className="btn-secondary flex items-center"
          >
            {creatingSampleData ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <PlusIcon className="h-4 w-4 mr-2" />
            )}
            Quick Sample Data
          </button>
          <button
            onClick={fetchActiveBuses}
            className="btn-secondary flex items-center"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Active Buses Count */}
      <div className="card">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <TruckIcon className="h-8 w-8 text-primary-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">Active Buses</h3>
            <p className="text-2xl font-semibold text-gray-900">
              {activeBuses.length}
            </p>
          </div>
        </div>
      </div>

      {/* Active Buses List */}
      {(activeBuses.length > 0 || simulatedBuses.size > 0) ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Real Active Buses */}
          {activeBuses.map((bus) => (
            <div key={bus.tripId} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Bus {bus.busNumber}
                  </h3>
                  <p className="text-sm text-gray-500">{bus.routeName}</p>
                  <p className="text-sm text-gray-500">Driver: {bus.driverName}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>
                  <span className="text-sm text-gray-500">Active</span>
                </div>
              </div>

              {/* Dispatch Controls */}
              <div className="mb-4 flex space-x-2">
                <button
                  onClick={() => startBusSimulation(bus.tripId, bus)}
                  disabled={busMovementService.isSimulationRunning(bus.tripId)}
                  className="btn-primary flex items-center text-sm"
                >
                  <PlayIcon className="h-4 w-4 mr-1" />
                  Dispatch
                </button>
                {busMovementService.isSimulationRunning(bus.tripId) && (
                  <button
                    onClick={() => stopBusSimulation(bus.tripId)}
                    className="btn-danger flex items-center text-sm"
                  >
                    <StopIcon className="h-4 w-4 mr-1" />
                    Stop
                  </button>
                )}
              </div>

              {bus.currentLocation ? (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 text-primary-600 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm font-medium">
                        {bus.currentLocation.latitude.toFixed(4)}, {bus.currentLocation.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <ChartBarIcon className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Speed</p>
                      <p className="text-sm font-medium">
                        {formatSpeed(bus.currentLocation.speed)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Heading</p>
                      <p className="text-sm font-medium">
                        {formatHeading(bus.currentLocation.heading)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-600 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Last Update</p>
                      <p className="text-sm font-medium">
                        {new Date(bus.currentLocation.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No location data available</p>
                </div>
              )}
            </div>
          ))}

          {/* Simulated Buses */}
          {Array.from(simulatedBuses.values()).map((bus) => (
            <div key={`sim-${bus.tripId}`} className="card border-blue-200 bg-blue-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Bus {bus.busNumber} (Simulated)
                  </h3>
                  <p className="text-sm text-gray-500">{bus.routeName}</p>
                  <p className="text-sm text-gray-500">Driver: {bus.driverName}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-blue-400 animate-pulse"></div>
                  <span className="text-sm text-gray-500">Simulating</span>
                </div>
              </div>

              {/* Stop Simulation Button */}
              <div className="mb-4">
                <button
                  onClick={() => stopBusSimulation(bus.tripId)}
                  className="btn-danger flex items-center text-sm"
                >
                  <StopIcon className="h-4 w-4 mr-1" />
                  Stop Simulation
                </button>
              </div>

              {bus.currentLocation && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 text-primary-600 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm font-medium">
                        {bus.currentLocation.latitude.toFixed(4)}, {bus.currentLocation.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <ChartBarIcon className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Speed</p>
                      <p className="text-sm font-medium">
                        {formatSpeed(bus.currentLocation.speed)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Heading</p>
                      <p className="text-sm font-medium">
                        {formatHeading(bus.currentLocation.heading)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-600 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Last Update</p>
                      <p className="text-sm font-medium">
                        {new Date(bus.currentLocation.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Active Buses</h3>
          <p className="mt-1 text-sm text-gray-500">
            Generate sample data to see live bus tracking in action.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={generateFullSampleData}
              disabled={generatingFullSampleData}
              className="btn-primary"
            >
              {generatingFullSampleData ? 'Generating...' : 'Generate Full Sample Data'}
            </button>
            <button
              onClick={createSampleData}
              disabled={creatingSampleData}
              className="btn-secondary"
            >
              {creatingSampleData ? 'Creating...' : 'Quick Sample Data'}
            </button>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            <p><strong>Full Sample Data:</strong> Creates complete system with users, routes, trips, and bookings</p>
            <p><strong>Quick Sample Data:</strong> Creates basic location data for existing trips</p>
          </div>
        </div>
      )}

      {/* Live Map View */}
      {(activeBuses.length > 0 || simulatedBuses.size > 0 || routeWaypoints.length > 0) && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Live Map View</h3>
          {console.log(`🗺️ Rendering map with ${activeBuses.length} active buses and ${simulatedBuses.size} simulated buses`)}
          <OpenStreetMapComponent
            center={[12.9716, 77.5946]} // Default to Bangalore
            zoom={12}
            busLocations={[
              // Real active buses
              ...activeBuses
                .filter(bus => bus.currentLocation)
                .map(bus => ({
                  latitude: bus.currentLocation.latitude,
                  longitude: bus.currentLocation.longitude,
                  busNumber: bus.busNumber,
                  routeName: bus.routeName,
                  driverName: bus.driverName,
                  speed: bus.currentLocation.speed,
                  status: bus.status,
                  timestamp: bus.currentLocation.timestamp,
                  heading: bus.currentLocation.heading
                })),
              // Simulated buses
              ...Array.from(simulatedBuses.values())
                .filter(bus => bus.currentLocation)
                .map(bus => ({
                  latitude: bus.currentLocation.latitude,
                  longitude: bus.currentLocation.longitude,
                  busNumber: bus.busNumber + ' (SIM)',
                  routeName: bus.routeName,
                  driverName: bus.driverName,
                  speed: bus.currentLocation.speed,
                  status: 'SIMULATING',
                  timestamp: bus.currentLocation.timestamp,
                  heading: bus.currentLocation.heading
                }))
            ]}
            busStops={[]}
            routeWaypoints={routeWaypoints}
            className="h-96 w-full"
          />
        </div>
      )}
    </div>
  );
};

export default LiveTracking;
