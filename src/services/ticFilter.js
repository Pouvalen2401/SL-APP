class TicFilterService {
  constructor() {
    this.ticPatterns = {
      eye_blink_rapid: { type: 'temporal', threshold: 3, window: 1000 },
      head_nod: { type: 'spatial', threshold: 0.1 },
      shoulder_shrug: { type: 'spatial', threshold: 0.15 },
      mouth_twitch: { type: 'temporal', threshold: 4, window: 2000 }
    };
    this.eventHistory = [];
  }

  filterFacialTics(faceLandmarks, userTics) {
    if (!userTics || userTics.length === 0) return faceLandmarks;

    let filtered = { ...faceLandmarks };

    userTics.forEach(tic => {
      if (tic === 'eye_blink_rapid') {
        filtered = this.filterEyeBlinks(filtered);
      } else if (tic === 'mouth_twitch') {
        filtered = this.filterMouthTwitches(filtered);
      }
    });

    return filtered;
  }

  filterPosturalTics(poseLandmarks, userTics) {
    if (!userTics || userTics.length === 0) return poseLandmarks;

    let filtered = [...poseLandmarks];

    userTics.forEach(tic => {
      if (tic === 'head_nod') {
        filtered = this.filterHeadNods(filtered);
      } else if (tic === 'shoulder_shrug') {
        filtered = this.filterShoulderShrugs(filtered);
      }
    });

    return filtered;
  }

  filterEyeBlinks(faceLandmarks) {
    const currentTime = Date.now();
    
    // Track blink events
    const upperEyelid = faceLandmarks[159]; // Upper eyelid landmark
    const lowerEyelid = faceLandmarks[145]; // Lower eyelid landmark
    
    if (upperEyelid && lowerEyelid) {
      const eyeDistance = Math.abs(upperEyelid.y - lowerEyelid.y);
      
      if (eyeDistance < 0.01) { // Eye closed
        this.eventHistory.push({ type: 'blink', time: currentTime });
      }
    }

    // Remove old events
    this.eventHistory = this.eventHistory.filter(
      event => currentTime - event.time < 1000
    );

    // If rapid blinking detected, normalize eye state
    const blinkCount = this.eventHistory.filter(e => e.type === 'blink').length;
    if (blinkCount > 3) {
      return this.normalizeEyeState(faceLandmarks);
    }

    return faceLandmarks;
  }

  filterMouthTwitches(faceLandmarks) {
    // Similar temporal filtering for mouth movements
    return faceLandmarks;
  }

  filterHeadNods(poseLandmarks) {
    // Filter involuntary head movements
    if (poseLandmarks.length === 0) return poseLandmarks;

    const nose = poseLandmarks[0];
    if (!nose) return poseLandmarks;

    // Check for repetitive vertical movement
    this.eventHistory.push({ 
      type: 'head_position', 
      y: nose.y, 
      time: Date.now() 
    });

    // Keep only recent history
    this.eventHistory = this.eventHistory.filter(
      event => Date.now() - event.time < 2000
    );

    // Detect oscillating pattern
    const positions = this.eventHistory
      .filter(e => e.type === 'head_position')
      .map(e => e.y);
    
    if (this.isOscillating(positions)) {
      return this.stabilizeHeadPosition(poseLandmarks);
    }

    return poseLandmarks;
  }

  filterShoulderShrugs(poseLandmarks) {
    // Filter involuntary shoulder movements
    return poseLandmarks;
  }

  normalizeEyeState(faceLandmarks) {
    // Return landmarks with normalized eye openness
    return faceLandmarks;
  }

  stabilizeHeadPosition(poseLandmarks) {
    // Return stabilized head position
    return poseLandmarks;
  }

  isOscillating(values) {
    if (values.length < 4) return false;
    
    let changes = 0;
    for (let i = 1; i < values.length; i++) {
      if ((values[i] - values[i-1]) * (values[i-1] - values[i-2 || 0]) < 0) {
        changes++;
      }
    }
    
    return changes >= 3;
  }
}

export default new TicFilterService();