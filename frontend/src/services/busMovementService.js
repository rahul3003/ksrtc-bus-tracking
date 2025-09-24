class BusMovementService {
  constructor() {
    this.simulations = new Map();
    this.callbacks = new Map();
  }

  // Start bus movement simulation
  startSimulation(tripId, waypoints, onLocationUpdate, routePath = null) {
    if (this.simulations.has(tripId)) {
      this.stopSimulation(tripId);
    }

    console.log(`🚌 Starting simulation for trip ${tripId} with ${waypoints.length} waypoints`);
    console.log('Waypoints:', waypoints);

    this.callbacks.set(tripId, onLocationUpdate);
    
    let currentWaypointIndex = 0;
    let isMoving = false;
    let currentPosition = { ...waypoints[0] };
    let lastUpdateTime = Date.now();

    const simulation = {
      tripId,
      waypoints,
      routePath,
      currentWaypointIndex,
      currentPosition,
      isMoving,
      lastUpdateTime,
      intervalId: null
    };

    this.simulations.set(tripId, simulation);

    // Start the simulation
    this.moveToNextWaypoint(tripId);
  }

  // Move bus to next waypoint
  moveToNextWaypoint(tripId) {
    const simulation = this.simulations.get(tripId);
    if (!simulation) {
      console.log(`❌ No simulation found for trip ${tripId}`);
      return;
    }

    const { waypoints, currentWaypointIndex } = simulation;
    console.log(`📍 Moving to next waypoint for trip ${tripId}, current index: ${currentWaypointIndex}`);
    
    if (currentWaypointIndex >= waypoints.length - 1) {
      // Reached the end, restart from beginning
      console.log(`🔄 Reached end of route for trip ${tripId}, restarting...`);
      simulation.currentWaypointIndex = 0;
      simulation.currentPosition = { ...waypoints[0] };
    }

    const currentWaypoint = waypoints[simulation.currentWaypointIndex];
    const nextWaypointIndex = simulation.currentWaypointIndex + 1;
    const nextWaypoint = waypoints[nextWaypointIndex];

    if (!nextWaypoint) {
      // End of route, restart
      console.log(`🔄 No next waypoint for trip ${tripId}, restarting...`);
      this.moveToNextWaypoint(tripId);
      return;
    }

    console.log(`🚌 Moving from waypoint ${currentWaypointIndex} to ${nextWaypointIndex} for trip ${tripId}`);

    // Calculate movement parameters
    const distance = this.calculateDistance(
      currentWaypoint.latitude,
      currentWaypoint.longitude,
      nextWaypoint.latitude,
      nextWaypoint.longitude
    );

    const speed = 30; // km/h
    const timeToReach = (distance / speed) * 3600 * 1000; // Convert to milliseconds
    const steps = Math.max(10, Math.floor(timeToReach / 2000)); // Update every 2 seconds

    console.log(`📏 Distance: ${distance.toFixed(2)}km, Time: ${(timeToReach/1000).toFixed(1)}s, Steps: ${steps}`);

    // Start movement
    this.animateMovement(tripId, currentWaypoint, nextWaypoint, steps, timeToReach);
  }

  // Animate bus movement between waypoints
  animateMovement(tripId, from, to, steps, totalTime) {
    const simulation = this.simulations.get(tripId);
    if (!simulation) {
      console.log(`❌ No simulation found for trip ${tripId} in animateMovement`);
      return;
    }

    console.log(`🎬 Starting animation for trip ${tripId} from (${from.latitude}, ${from.longitude}) to (${to.latitude}, ${to.longitude})`);
    console.log(`⏱️ Total time: ${(totalTime/1000).toFixed(1)}s, Steps: ${steps}, Step time: ${(totalTime/steps/1000).toFixed(1)}s`);

    let currentStep = 0;
    const stepTime = totalTime / steps;

    // Get route path coordinates if available
    let pathCoordinates = null;
    if (simulation.routePath && simulation.routePath.coordinates) {
      pathCoordinates = simulation.routePath.coordinates;
    }

    const moveInterval = setInterval(() => {
      if (!this.simulations.has(tripId)) {
        console.log(`❌ Simulation removed for trip ${tripId}, stopping animation`);
        clearInterval(moveInterval);
        return;
      }

      currentStep++;
      const progress = currentStep / steps;

      if (progress >= 1) {
        // Reached the waypoint
        clearInterval(moveInterval);
        
        // Update position to exact waypoint
        simulation.currentPosition = { ...to };
        simulation.currentWaypointIndex++;
        
        // Stop at waypoint if it has stop time
        if (to.stopTime > 0) {
          setTimeout(() => {
            this.moveToNextWaypoint(tripId);
          }, to.stopTime);
        } else {
          this.moveToNextWaypoint(tripId);
        }
      } else {
        let lat, lng;
        
        if (pathCoordinates && pathCoordinates.length > 0) {
          // Use real route path coordinates
          const pathIndex = Math.floor(progress * (pathCoordinates.length - 1));
          const coord = pathCoordinates[pathIndex];
          lat = coord.latitude;
          lng = coord.longitude;
        } else {
          // Fallback to linear interpolation
          lat = from.latitude + (to.latitude - from.latitude) * progress;
          lng = from.longitude + (to.longitude - from.longitude) * progress;
        }
        
        // Calculate heading
        const heading = this.calculateHeading(from.latitude, from.longitude, to.latitude, to.longitude);
        
        simulation.currentPosition = {
          latitude: lat,
          longitude: lng,
          speed: 30,
          heading: heading,
          timestamp: new Date()
        };

        // Log every 5th step to avoid spam
        if (currentStep % 5 === 0) {
          console.log(`🚌 Trip ${tripId} progress: ${(progress * 100).toFixed(1)}% at (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
        }
      }

      // Notify callback
      const callback = this.callbacks.get(tripId);
      if (callback) {
        console.log(`📡 Sending location update for trip ${tripId}:`, simulation.currentPosition);
        callback({
          tripId,
          ...simulation.currentPosition
        });
      } else {
        console.log(`❌ No callback found for trip ${tripId}`);
      }
    }, stepTime);

    simulation.intervalId = moveInterval;
  }

  // Stop bus movement simulation
  stopSimulation(tripId) {
    const simulation = this.simulations.get(tripId);
    if (simulation && simulation.intervalId) {
      clearInterval(simulation.intervalId);
    }
    
    this.simulations.delete(tripId);
    this.callbacks.delete(tripId);
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Calculate heading between two points
  calculateHeading(lat1, lon1, lat2, lon2) {
    const dLon = this.toRadians(lon2 - lon1);
    const lat1Rad = this.toRadians(lat1);
    const lat2Rad = this.toRadians(lat2);
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    let heading = Math.atan2(y, x);
    heading = this.toDegrees(heading);
    heading = (heading + 360) % 360;
    
    return heading;
  }

  // Convert degrees to radians
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Convert radians to degrees
  toDegrees(radians) {
    return radians * (180 / Math.PI);
  }

  // Get current position of a bus
  getCurrentPosition(tripId) {
    const simulation = this.simulations.get(tripId);
    return simulation ? simulation.currentPosition : null;
  }

  // Check if simulation is running
  isSimulationRunning(tripId) {
    return this.simulations.has(tripId);
  }
}

// Export singleton instance
export default new BusMovementService();
