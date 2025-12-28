class FaceRecognitionService {
  constructor() {
    this.knownFaces = [];
    this.threshold = 0.6;
  }

  async loadKnownFaces(users) {
    this.knownFaces = users.filter(user => user.faceDescriptor);
  }

  extractFaceDescriptor(faceLandmarks) {
    if (!faceLandmarks || faceLandmarks.length === 0) return null;

    // Extract key facial features
    // This is simplified - in production use face-api.js or similar
    const descriptor = [];
    
    // Sample 20 key landmarks
    const keyIndices = [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323,
      162, 127, 234, 93, 132, 58, 172, 136, 150, 176
    ];

    keyIndices.forEach(idx => {
      if (faceLandmarks[idx]) {
        descriptor.push(
          faceLandmarks[idx].x,
          faceLandmarks[idx].y,
          faceLandmarks[idx].z
        );
      }
    });

    return descriptor;
  }

  calculateDistance(descriptor1, descriptor2) {
    if (!descriptor1 || !descriptor2 || 
        descriptor1.length !== descriptor2.length) {
      return Infinity;
    }

    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
      sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
    }
    return Math.sqrt(sum);
  }

  recognizeUser(faceLandmarks) {
    const descriptor = this.extractFaceDescriptor(faceLandmarks);
    if (!descriptor) return null;

    let bestMatch = null;
    let minDistance = Infinity;

    this.knownFaces.forEach(user => {
      const distance = this.calculateDistance(descriptor, user.faceDescriptor);
      if (distance < minDistance && distance < this.threshold) {
        minDistance = distance;
        bestMatch = user;
      }
    });

    return bestMatch ? {
      user: bestMatch,
      confidence: 1 - (minDistance / this.threshold)
    } : null;
  }

  async registerFace(userId, faceLandmarks) {
    const descriptor = this.extractFaceDescriptor(faceLandmarks);
    return descriptor;
  }
}

export default new FaceRecognitionService();
