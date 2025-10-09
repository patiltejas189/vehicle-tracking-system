// GPS Data Quality Engine
// Implements Kalman filtering, accuracy validation, and data quality scoring

class GPSQualityEngine {
  constructor() {
    // Kalman filter parameters for GPS smoothing
    this.processNoise = 0.001; // Process noise
    this.measurementNoise = 10; // Measurement noise (GPS accuracy)
    this.estimatedError = 1; // Initial estimation error

    // Speed validation parameters
    this.maxReasonableSpeed = 200; // km/h (highway speeds)
    this.maxAcceleration = 10; // m/s² (reasonable acceleration)

    // Distance validation
    this.maxJumpDistance = 1000; // meters (max reasonable distance between updates)
  }

  // Kalman filter for GPS coordinate smoothing
  kalmanFilter(lat, lng, accuracy, previousEstimate = null) {
    if (!previousEstimate) {
      // First measurement
      return {
        latitude: lat,
        longitude: lng,
        accuracy: accuracy,
        kalmanGain: 1,
        estimatedError: this.estimatedError
      };
    }

    // Prediction step
    const predictedError = previousEstimate.estimatedError + this.processNoise;

    // Update step
    const kalmanGain = predictedError / (predictedError + accuracy);
    const filteredLat = previousEstimate.latitude + kalmanGain * (lat - previousEstimate.latitude);
    const filteredLng = previousEstimate.longitude + kalmanGain * (lng - previousEstimate.longitude);
    const updatedError = (1 - kalmanGain) * predictedError;

    return {
      latitude: filteredLat,
      longitude: filteredLng,
      accuracy: Math.sqrt(updatedError),
      kalmanGain: kalmanGain,
      estimatedError: updatedError
    };
  }

  // Validate GPS data quality
  validateGPSData(data, previousData = null) {
    const issues = [];
    let qualityScore = 100; // Start with perfect score

    // Accuracy validation
    if (data.accuracy > 100) {
      issues.push('Low GPS accuracy');
      qualityScore -= 30;
    } else if (data.accuracy > 50) {
      issues.push('Moderate GPS accuracy');
      qualityScore -= 15;
    }

    // Coordinate validation
    if (data.latitude < -90 || data.latitude > 90 || data.longitude < -180 || data.longitude > 180) {
      issues.push('Invalid coordinates');
      qualityScore -= 50;
    }

    // Speed validation
    if (data.speed !== undefined && data.speed !== null) {
      if (data.speed < 0) {
        issues.push('Negative speed');
        qualityScore -= 20;
      } else if (data.speed > this.maxReasonableSpeed) {
        issues.push('Unrealistic speed');
        qualityScore -= 40;
      }
    }

    // Heading validation
    if (data.heading !== undefined && data.heading !== null) {
      if (data.heading < 0 || data.heading > 360) {
        issues.push('Invalid heading');
        qualityScore -= 10;
      }
    }

    // Altitude validation
    if (data.altitude !== undefined && data.altitude !== null) {
      if (data.altitude < -500 || data.altitude > 10000) {
        issues.push('Invalid altitude');
        qualityScore -= 15;
      }
    }

    // Time-based validation with previous data
    if (previousData) {
      const timeDiff = (new Date(data.timestamp) - new Date(previousData.timestamp)) / 1000; // seconds

      if (timeDiff > 0) {
        // Distance jump validation
        const distance = this.calculateDistance(
          data.latitude, data.longitude,
          previousData.latitude, previousData.longitude
        );

        const speedCheck = (distance / 1000) / (timeDiff / 3600); // km/h

        if (speedCheck > this.maxReasonableSpeed) {
          issues.push(`Unrealistic speed jump: ${speedCheck.toFixed(1)} km/h`);
          qualityScore -= 35;
        }

        // Acceleration validation
        if (previousData.speed !== undefined && data.speed !== undefined) {
          const acceleration = (data.speed - previousData.speed) / timeDiff; // m/s²
          if (Math.abs(acceleration) > this.maxAcceleration) {
            issues.push(`Extreme acceleration: ${acceleration.toFixed(1)} m/s²`);
            qualityScore -= 25;
          }
        }
      }
    }

    return {
      isValid: qualityScore >= 60, // Accept if score >= 60
      qualityScore: Math.max(0, Math.min(100, qualityScore)),
      issues: issues,
      recommendedAction: qualityScore < 40 ? 'discard' : qualityScore < 60 ? 'flag' : 'accept'
    };
  }

  // Calculate distance between two GPS points using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Distance in meters
  }

  // Smooth GPS track by removing outliers and applying filters
  smoothGPSTrack(gpsPoints) {
    if (!Array.isArray(gpsPoints) || gpsPoints.length < 2) {
      return gpsPoints;
    }

    const smoothed = [];
    let previousEstimate = null;

    for (const point of gpsPoints) {
      // Validate point quality
      const validation = this.validateGPSData(point, smoothed[smoothed.length - 1]);

      if (!validation.isValid && validation.recommendedAction === 'discard') {
        console.warn('Discarding low-quality GPS point:', validation.issues);
        continue;
      }

      // Apply Kalman filtering
      const filtered = this.kalmanFilter(point.latitude, point.longitude, point.accuracy || 10, previousEstimate);

      const smoothedPoint = {
        ...point,
        latitude: filtered.latitude,
        longitude: filtered.longitude,
        accuracy: filtered.accuracy,
        quality_score: validation.qualityScore,
        quality_issues: validation.issues,
        filtered: true
      };

      smoothed.push(smoothedPoint);
      previousEstimate = filtered;
    }

    return smoothed;
  }

  // Calculate route statistics with quality metrics
  calculateRouteStats(gpsPoints) {
    if (!Array.isArray(gpsPoints) || gpsPoints.length < 2) {
      return null;
    }

    let totalDistance = 0;
    let totalTime = 0;
    let maxSpeed = 0;
    let avgSpeed = 0;
    let stopCount = 0;
    let idleTime = 0;
    let qualityMetrics = {
      avgAccuracy: 0,
      lowQualityPoints: 0,
      totalPoints: gpsPoints.length
    };

    for (let i = 1; i < gpsPoints.length; i++) {
      const current = gpsPoints[i];
      const previous = gpsPoints[i - 1];

      // Distance calculation
      const distance = this.calculateDistance(
        current.latitude, current.longitude,
        previous.latitude, previous.longitude
      );
      totalDistance += distance;

      // Time calculation
      const timeDiff = (new Date(current.timestamp) - new Date(previous.timestamp)) / 1000;
      totalTime += timeDiff;

      // Speed analysis
      if (current.speed !== undefined && current.speed > maxSpeed) {
        maxSpeed = current.speed;
      }

      // Stop detection (speed < 5 km/h for > 5 minutes)
      if (current.speed < 5 && timeDiff > 300) {
        stopCount++;
        idleTime += timeDiff;
      }

      // Quality metrics
      if (current.accuracy) {
        qualityMetrics.avgAccuracy += current.accuracy;
      }
      if (current.quality_score && current.quality_score < 60) {
        qualityMetrics.lowQualityPoints++;
      }
    }

    qualityMetrics.avgAccuracy /= gpsPoints.length;

    return {
      totalDistance: totalDistance / 1000, // km
      totalTime: totalTime / 3600, // hours
      avgSpeed: totalTime > 0 ? (totalDistance / 1000) / (totalTime / 3600) : 0,
      maxSpeed: maxSpeed,
      stopCount: stopCount,
      idleTime: idleTime / 3600, // hours
      qualityMetrics: qualityMetrics,
      efficiency: totalTime > 0 ? (totalDistance / 1000) / totalTime : 0 // km/hour efficiency
    };
  }
}

module.exports = new GPSQualityEngine();