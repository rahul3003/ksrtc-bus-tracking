import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import { AnimatePresence, motion } from "framer-motion";
import "leaflet/dist/leaflet.css";
import {
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  ClockIcon,
  MapPinIcon,
  BellIcon,
  InformationCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  UserIcon,
  PhoneIcon,
  StarIcon,
  AdjustmentsHorizontalIcon,
  PlayIcon,
  PauseIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";

const GRAPHOPPER_API_KEY = "cd03d788-0fba-4e9f-b52b-a9b2028d45cf";

// Karnataka bus route: Bangalore to Hubli
const BUS_STOPS = [
  {
    id: 1,
    name: "Bangalore City Railway Station",
    coordinates: [12.9762, 77.6033],
    type: "start"
  },
  {
    id: 2,
    name: "Tumkur",
    coordinates: [13.3409, 77.1022],
    type: "stop"
  },
  {
    id: 3,
    name: "Tiptur",
    coordinates: [13.2563, 76.4775],
    type: "stop"
  },
  {
    id: 4,
    name: "Arsikere",
    coordinates: [13.3145, 76.2570],
    type: "stop"
  },
  {
    id: 5,
    name: "Hassan",
    coordinates: [13.0049, 76.0995],
    type: "stop"
  },
  {
    id: 6,
    name: "Hubli Railway Station",
    coordinates: [15.3647, 75.1240],
    type: "destination"
  }
];

// Alternative route: Bangalore to Mysore via Mandya
const ALTERNATIVE_STOPS = [
  {
    id: 1,
    name: "Bangalore Majestic",
    coordinates: [12.9774, 77.5707],
    type: "start"
  },
  {
    id: 2,
    name: "Kengeri",
    coordinates: [12.9068, 77.4856],
    type: "stop"
  },
  {
    id: 3,
    name: "Ramanagara",
    coordinates: [12.7159, 77.3019],
    type: "stop"
  },
  {
    id: 4,
    name: "Mandya",
    coordinates: [12.5220, 76.8970],
    type: "stop"
  },
  {
    id: 5,
    name: "Srirangapatna",
    coordinates: [12.4136, 76.7044],
    type: "stop"
  },
  {
    id: 6,
    name: "Mysore Palace",
    coordinates: [12.3051, 76.6552],
    type: "destination"
  }
];

// Function to create custom icons
const createStopIcon = (type, isActive = false) => {
  const colors = {
    start: "#10B981",
    stop: isActive ? "#F59E0B" : "#3B82F6",
    destination: "#EF4444"
  };
  
  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="
        background: ${colors[type]};
        color: white;
        border-radius: 50%;
        width: ${type === 'start' || type === 'destination' ? '40px' : '35px'};
        height: ${type === 'start' || type === 'destination' ? '40px' : '35px'};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${type === 'start' || type === 'destination' ? '16px' : '14px'};
        font-weight: bold;
        border: 3px solid white;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: all 0.3s ease;
        ${isActive ? 'transform: scale(1.1);' : ''}
      ">
        ${type === 'start' ? '🚀' : type === 'destination' ? '🏁' : '🚏'}
      </div>
    `,
    iconSize: [type === 'start' || type === 'destination' ? 40 : 35, type === 'start' || type === 'destination' ? 40 : 35],
    iconAnchor: [type === 'start' || type === 'destination' ? 20 : 17, type === 'start' || type === 'destination' ? 20 : 17],
  });
};

const busIcon = L.divIcon({
  className: 'custom-bus-marker',
  html: `
    <div style="
      background: linear-gradient(135deg, #3B82F6, #1D4ED8);
      color: white;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      animation: pulse 2s infinite;
      position: relative;
    ">
      🚌
      <div style="
        position: absolute;
        top: -5px;
        right: -5px;
        width: 12px;
        height: 12px;
        background: #10B981;
        border-radius: 50%;
        border: 2px solid white;
        animation: pulse 1s infinite;
      "></div>
    </div>
  `,
  iconSize: [50, 50],
  iconAnchor: [25, 25],
});

// Component to recenter map when bus position changes
const MapFollower = ({ position, isFollowing }) => {
  const map = useMap();

  useEffect(() => {
    if (position && isFollowing) {
      map.panTo(position);
    }
  }, [position, map, isFollowing]);

  return null;
};

const MapView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // State management
  const [currentRoute, setCurrentRoute] = useState(BUS_STOPS);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [targetStopIndex, setTargetStopIndex] = useState(null);
  const [busPosition, setBusPosition] = useState(BUS_STOPS[0].coordinates);
  const [route, setRoute] = useState([]);
  const [isMoving, setIsMoving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFollowingBus, setIsFollowingBus] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [animationSpeed, setAnimationSpeed] = useState(200); // Slower movement speed
  const [searchValue, setSearchValue] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [busInfo] = useState({
    busNumber: `KA-${id || "01"}`,
    driver: "Suresh Kumar",
    rating: 4.8,
    capacity: "50 seats",
    occupancy: "35 passengers",
    status: "Ready",
    currentStop: BUS_STOPS[0].name,
    nextStop: BUS_STOPS[1]?.name || "Destination",
  });

  const currentStop = currentRoute[currentStopIndex];
  const nextStop = currentRoute[currentStopIndex + 1];
  const progressPercentage = (currentStopIndex / (currentRoute.length - 1)) * 100;

  // Fetch route between current and target stop
  const fetchRouteBetweenStops = useCallback(async (fromStop, toStop) => {
    try {
      const url = `https://graphhopper.com/api/1/route?point=${fromStop.coordinates[0]},${fromStop.coordinates[1]}&point=${toStop.coordinates[0]},${toStop.coordinates[1]}&vehicle=car&points_encoded=false&key=${GRAPHOPPER_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.paths && data.paths.length > 0) {
        const routePath = data.paths[0].points.coordinates.map(([lng, lat]) => [lat, lng]);
        return routePath;
      }
      return [];
    } catch (error) {
      console.error("Error fetching route:", error);
      return [];
    }
  }, []);

  // Move bus to a specific stop
  const moveBusToStop = useCallback(async (targetIndex) => {
    if (targetIndex === currentStopIndex || isMoving) return;
    
    setIsMoving(true);
    setTargetStopIndex(targetIndex);
    
    const fromStop = currentRoute[currentStopIndex];
    const toStop = currentRoute[targetIndex];
    
    // Add notification
    setNotifications(prev => [...prev, {
      name: `Moving to ${toStop.name}`,
      eta: Math.abs(targetIndex - currentStopIndex) * 2,
      type: "info"
    }]);

    try {
      const routePath = await fetchRouteBetweenStops(fromStop, toStop);
      
      if (routePath.length > 0) {
        setRoute(routePath);
        
        // Animate bus movement along route - slower and smoother
        let currentIndex = 0;
        const moveInterval = setInterval(() => {
          if (currentIndex < routePath.length - 1) {
            currentIndex++;
            setBusPosition(routePath[currentIndex]);
          } else {
            // Reached destination
            clearInterval(moveInterval);
            setCurrentStopIndex(targetIndex);
            setBusPosition(toStop.coordinates);
            setIsMoving(false);
            setTargetStopIndex(null);
            setRoute([]);
            
            // Update notifications
            setNotifications(prev => [...prev, {
              name: `Arrived at ${toStop.name}`,
              eta: 0,
              type: "success"
            }]);
          }
        }, animationSpeed); // Use full animationSpeed for smoother movement
      } else {
        // Fallback: direct movement
        setBusPosition(toStop.coordinates);
        setCurrentStopIndex(targetIndex);
        setIsMoving(false);
        setTargetStopIndex(null);
      }
    } catch (error) {
      console.error("Error moving bus:", error);
      setIsMoving(false);
      setTargetStopIndex(null);
    }
  }, [currentStopIndex, isMoving, fetchRouteBetweenStops, animationSpeed]);

  // Handle stop click
  const handleStopClick = useCallback((stopIndex) => {
    if (!isPaused && !isMoving) {
      moveBusToStop(stopIndex);
    }
  }, [isPaused, isMoving, moveBusToStop]);

  // Auto-advance to next stop (optional)
  useEffect(() => {
    if (!isPaused && !isMoving && currentStopIndex < currentRoute.length - 1) {
      const autoAdvance = setTimeout(() => {
        moveBusToStop(currentStopIndex + 1);
      }, 5000); // Auto-advance every 5 seconds (slower)
      
      return () => clearTimeout(autoAdvance);
    }
  }, [currentStopIndex, isPaused, isMoving, moveBusToStop, currentRoute.length]);

  // Initialize route for entire journey
  useEffect(() => {
    const initializeFullRoute = async () => {
      try {
        const fullRoute = [];
        for (let i = 0; i < currentRoute.length - 1; i++) {
          const segment = await fetchRouteBetweenStops(currentRoute[i], currentRoute[i + 1]);
          fullRoute.push(...segment);
        }
        setRoute(fullRoute);
      } catch (error) {
        console.error("Error initializing full route:", error);
      }
    };
    
    initializeFullRoute();
  }, [fetchRouteBetweenStops, currentRoute]);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching for:", searchValue);
  };

  const toggleFollowBus = () => {
    setIsFollowingBus(!isFollowingBus);
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const resetBus = () => {
    setCurrentStopIndex(0);
    setBusPosition(currentRoute[0].coordinates);
    setIsMoving(false);
    setIsPaused(false);
    setTargetStopIndex(null);
    setNotifications([]);
  };

  const simulateRoute = () => {
    // Switch between the two routes
    const newRoute = currentRoute === BUS_STOPS ? ALTERNATIVE_STOPS : BUS_STOPS;
    setCurrentRoute(newRoute);
    setCurrentStopIndex(0);
    setBusPosition(newRoute[0].coordinates);
    setIsMoving(false);
    setIsPaused(false);
    setTargetStopIndex(null);
    setRoute([]);
    setNotifications([{
      name: `Switched to ${newRoute === BUS_STOPS ? "Bangalore → Hubli Route" : "Bangalore → Mysore Route"}`,
      eta: 0,
      type: "info"
    }]);
  };

  const goToNextStop = () => {
    if (currentStopIndex < currentRoute.length - 1 && !isMoving) {
      moveBusToStop(currentStopIndex + 1);
    }
  };

  const previousStop = () => {
    if (currentStopIndex > 0 && !isMoving) {
      moveBusToStop(currentStopIndex - 1);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'flex flex-col items-center justify-start h-screen bg-gradient-to-b from-[#f0f0f0] to-[#e0e0e0] px-4 py-6 relative'}`}>
      {/* Header */}
      {!isFullscreen && (
        <div className="flex items-center justify-between w-full max-w-md mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-all duration-300 active:scale-95"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-800" />
        </button>
        <h2 className="text-[22px] font-extrabold tracking-wider text-gray-900 flex items-center">
          <span className="bg-blue-500 w-3 h-3 rounded-full mr-2 animate-pulse"></span>
          LIVE TRACKING
        </h2>
        <button
          onClick={() =>
            setNotifications((prev) => [
              ...prev,
              {
                name: "Bus is arriving soon!",
                eta: 2,
                type: "alert",
              },
            ])
          }
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-all duration-300 active:scale-95 relative"
        >
          <BellIcon className="h-6 w-6 text-gray-800" />
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>
      </div>
      )}

      {/* Fullscreen Header */}
      {isFullscreen && (
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all duration-300"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-800" />
            </button>
            <h2 className="text-[18px] font-extrabold tracking-wider text-white flex items-center">
              <span className="bg-blue-500 w-3 h-3 rounded-full mr-2 animate-pulse"></span>
              LIVE TRACKING
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                setNotifications((prev) => [
                  ...prev,
                  {
                    name: "Bus is arriving soon!",
                    eta: 2,
                    type: "alert",
                  },
                ])
              }
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all duration-300 relative"
            >
              <BellIcon className="h-6 w-6 text-gray-800" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Bus Info Card */}
      {!isFullscreen && (
        <div className="w-full max-w-md mb-4">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-blue-500 p-2 rounded-full mr-3">
                <ClockIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  Bus {busInfo.busNumber}
                </h3>
                <div className="flex items-center">
                  <p className="text-gray-600 text-sm">
                    {isMoving ? "Moving" : isPaused ? "Paused" : "Ready"}
                  </p>
                  <span className="mx-2 text-gray-400">•</span>
                  <p className="text-gray-600 text-sm">
                    {isMoving ? "En Route" : `At ${currentStop.name}`}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={toggleDetails}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all"
            >
              {showDetails ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-600">
                        {busInfo.driver}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <StarIcon className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="text-sm text-gray-600">
                        {busInfo.rating}/5.0
                      </span>
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-600">
                        Contact Driver
                      </span>
                    </div>
                    <div className="flex items-center">
                      <InformationCircleIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-600">
                        {busInfo.occupancy}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Journey Progress */}
          <div className="mt-3">
            <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
              <span>{currentRoute[0].name}</span>
              <span>{currentRoute[Math.floor(currentRoute.length / 2)].name}</span>
              <span>{currentRoute[currentRoute.length - 1].name}</span>
          </div>
            <div className="relative w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>

              {/* Current position indicator */}
              <div
                className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow-md transition-all duration-500 ease-in-out"
                style={{ left: `calc(${progressPercentage}% - 8px)` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                Stop {currentStopIndex + 1} of {currentRoute.length}
              </span>
              <span className="text-xs text-blue-600 font-medium">
                {Math.round(progressPercentage)}% Complete
              </span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Search Box */}
      {!isFullscreen && (
      <form onSubmit={handleSearch} className="relative w-full max-w-md mb-4">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search Karnataka stops..."
          className="w-full pl-10 pr-4 py-3 bg-white rounded-full shadow-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
        />
      </form>
      )}

      {/* Map Container */}
      <div className={`${isFullscreen ? 'w-full h-full' : 'w-full max-w-md h-[50vh] bg-white rounded-2xl overflow-hidden shadow-lg relative'}`}>
        <MapContainer
          center={currentRoute[0].coordinates}
          zoom={8}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Bus Stop Markers */}
          {currentRoute.map((stop, index) => (
            <Marker
              key={stop.id}
              position={stop.coordinates}
              icon={createStopIcon(stop.type, index === targetStopIndex)}
              eventHandlers={{
                click: () => handleStopClick(index),
              }}
            >
              <Popup>
                <div className="text-center">
                  <h4 className="font-bold text-gray-900">{stop.name}</h4>
                  <p className="text-sm text-gray-600">
                    {stop.type === 'start' ? 'Starting Point' : 
                     stop.type === 'destination' ? 'Final Destination' : 
                     `Bus Stop #${index}`}
                  </p>
                  {index === currentStopIndex && (
                    <p className="text-sm text-green-600 font-medium">Current Location</p>
                  )}
                  {index === targetStopIndex && (
                    <p className="text-sm text-blue-600 font-medium">Moving Here</p>
                  )}
                  {!isPaused && !isMoving && index !== currentStopIndex && (
                    <button 
                      className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600"
                      onClick={() => handleStopClick(index)}
                    >
                      Move Bus Here
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Route Polyline */}
          {route.length > 0 && (
            <Polyline
              positions={route}
              color="#3B82F6"
              weight={5}
              dashArray={[10, 5]}
              opacity={0.7}
            />
          )}

          {/* Bus Marker */}
          {busPosition && (
            <Marker position={busPosition} icon={busIcon}>
              <Popup>
                <div className="text-center">
                  <p className="font-bold">Bus {busInfo.busNumber}</p>
                  <p className="text-sm">Driver: {busInfo.driver}</p>
                  <p className="text-sm text-blue-600">
                    Status: {isMoving ? "Moving" : isPaused ? "Paused" : "Ready"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Current: {currentStop.name}
                  </p>
                  {nextStop && (
                    <p className="text-sm text-gray-600">
                      Next: {nextStop.name}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Map follower component */}
          {isFollowingBus && busPosition && (
            <MapFollower position={busPosition} isFollowing={isFollowingBus} />
          )}
        </MapContainer>

        {/* Map Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
          <button
            onClick={toggleFullscreen}
            className="p-3 bg-white rounded-full shadow-md text-gray-700 hover:bg-gray-100 transition-all duration-300"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="h-5 w-5" />
            ) : (
              <ArrowsPointingOutIcon className="h-5 w-5" />
            )}
          </button>

          <button
            onClick={toggleFollowBus}
            className={`p-3 rounded-full shadow-md transition-all duration-300 ${
              isFollowingBus
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700"
            }`}
            title="Follow Bus"
          >
            <MapPinIcon className="h-5 w-5" />
          </button>

          <button
            onClick={togglePause}
            className={`p-3 rounded-full shadow-md transition-all duration-300 ${
              isPaused
                ? "bg-green-500 text-white"
                : "bg-white text-gray-700"
            }`}
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <PlayIcon className="h-5 w-5" /> : <PauseIcon className="h-5 w-5" />}
          </button>

          <button
            onClick={resetBus}
            className="p-3 bg-white rounded-full shadow-md text-gray-700 hover:bg-gray-100"
            title="Reset to Start"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>

          <button
            onClick={() =>
              setAnimationSpeed((prev) => {
                if (prev === 200) return 500; // Slow -> Medium
                if (prev === 500) return 100; // Medium -> Very Slow
                return 200; // Very Slow -> Slow
              })
            }
            className="p-3 bg-white rounded-full shadow-md text-gray-700 hover:bg-gray-100"
            title="Speed Control"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Controls */}
        <div className="absolute bottom-4 left-4 flex space-x-2">
          <button
            onClick={previousStop}
            disabled={currentStopIndex === 0 || isMoving}
            className={`p-2 rounded-full shadow-md transition-all duration-300 ${
              currentStopIndex === 0 || isMoving
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            title="Previous Stop"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>

          <button
            onClick={goToNextStop}
            disabled={currentStopIndex === currentRoute.length - 1 || isMoving}
            className={`p-2 rounded-full shadow-md transition-all duration-300 ${
              currentStopIndex === currentRoute.length - 1 || isMoving
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            title="Next Stop"
          >
            <ArrowLeftIcon className="h-4 w-4 rotate-180" />
          </button>
          </div>

        {/* Speed indicator */}
        {!isFullscreen && (
          <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium shadow-md">
            {animationSpeed === 100 ? "Very Slow" : animationSpeed === 200 ? "Slow" : animationSpeed === 500 ? "Medium" : "Fast"}
          </div>
        )}

        {/* Fullscreen Speed indicator */}
        {isFullscreen && (
          <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm px-3 py-2 rounded-full text-xs font-medium shadow-md text-white">
            <div className="flex items-center space-x-2">
              <span>Speed:</span>
              <span className="text-blue-300">
                {animationSpeed === 100 ? "Very Slow" : animationSpeed === 200 ? "Slow" : animationSpeed === 500 ? "Medium" : "Fast"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Stops */}
      {!isFullscreen && (
        <div className="w-full max-w-md mt-4">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center justify-between">
            <div className="flex items-center">
              <MapPinIcon className="h-5 w-5 text-blue-500 mr-2" />
              Bus Stops ({currentStopIndex + 1}/{currentRoute.length})
            </div>
            <button
              onClick={simulateRoute}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 transition-colors"
              title="Switch Route"
            >
              Simulate
            </button>
          </h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {currentRoute.map((stop, index) => (
              <div 
                key={stop.id} 
                className={`flex items-center p-2 rounded-lg transition-all duration-200 ${
                  index === currentStopIndex 
                    ? "bg-green-50 border-2 border-green-200" 
                    : index === targetStopIndex 
                    ? "bg-blue-50 border-2 border-blue-200" 
                    : index < currentStopIndex 
                    ? "bg-gray-50 opacity-60" 
                    : "bg-white hover:bg-gray-50 cursor-pointer"
                }`}
                onClick={() => !isMoving && index !== currentStopIndex && handleStopClick(index)}
              >
                <div className="relative mr-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index === currentStopIndex 
                      ? "bg-green-500 text-white" 
                      : index === targetStopIndex 
                      ? "bg-blue-500 text-white" 
                      : index < currentStopIndex 
                      ? "bg-gray-400 text-white" 
                      : "bg-blue-100 text-blue-600"
                  }`}>
                    {index === currentStopIndex ? "📍" : index === targetStopIndex ? "🎯" : index + 1}
                  </div>
                  {index < currentRoute.length - 1 && (
                    <div className={`absolute top-8 left-1/2 w-0.5 h-3 ${
                      index < currentStopIndex ? "bg-gray-400" : "bg-gray-300"
                    }`}></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    index === currentStopIndex ? "text-green-700" : 
                    index === targetStopIndex ? "text-blue-700" : 
                    "text-gray-900"
                  }`}>
                    {stop.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {index === currentStopIndex 
                      ? "Current Location" 
                      : index === targetStopIndex 
                      ? "Moving Here..." 
                      : index < currentStopIndex 
                      ? "Completed" 
                      : `Stop ${index + 1}`
                    }
                  </p>
                </div>
                <div className="text-right">
                  {index === currentStopIndex && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Now
                    </span>
                  )}
                  {index === targetStopIndex && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full animate-pulse">
                      Moving
                    </span>
                  )}
                  {!isMoving && index > currentStopIndex && (
                    <button 
                      className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full hover:bg-blue-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStopClick(index);
                      }}
                    >
                      Go
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Notifications */}
      <div className="fixed bottom-6 right-4 flex flex-col items-end space-y-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map((notification, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`w-80 backdrop-blur-md shadow-lg rounded-xl px-4 py-3 pointer-events-auto relative
                ${
                  notification.type === "warning"
                    ? "bg-amber-50/90 border border-amber-200"
                    : notification.type === "alert"
                    ? "bg-red-50/90 border border-red-200"
                    : notification.type === "success"
                    ? "bg-green-50/90 border border-green-200"
                    : "bg-white/90 border border-gray-200"
                }`}
            >
              {/* Close button */}
              <button
                onClick={() => setNotifications(prev => prev.filter((_, i) => i !== index))}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center space-x-2 pr-6">
                <BellIcon
                  className={`h-5 w-5 ${
                    notification.type === "warning"
                      ? "text-amber-500"
                      : notification.type === "alert"
                      ? "text-red-500"
                      : notification.type === "success"
                      ? "text-green-500"
                      : "text-blue-500"
                  }`}
                />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {notification.name}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {notification.eta > 0
                      ? `Arriving in ${notification.eta} min`
                      : "Arriving now!"}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MapView;
