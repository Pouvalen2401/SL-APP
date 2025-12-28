import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { FaceMesh, FACEMESH_TESSELATION } from '@mediapipe/face_mesh';

class MediaPipeService {
  constructor() {
    this.hands = null;
    this.pose = null;
    this.faceMesh = null;
    this.isInitialized = false;
  }

  async initialize() {
    // Initialize Hands
    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    // Initialize Pose
    this.pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    // Initialize Face Mesh
    this.faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.isInitialized = true;
  }

  setHandsCallback(callback) {
    if (this.hands) {
      this.hands.onResults(callback);
    }
  }

  setPoseCallback(callback) {
    if (this.pose) {
      this.pose.onResults(callback);
    }
  }

  setFaceMeshCallback(callback) {
    if (this.faceMesh) {
      this.faceMesh.onResults(callback);
    }
  }

  async detectHands(imageElement) {
    if (!this.hands) return null;
    await this.hands.send({ image: imageElement });
  }

  async detectPose(imageElement) {
    if (!this.pose) return null;
    await this.pose.send({ image: imageElement });
  }

  async detectFace(imageElement) {
    if (!this.faceMesh) return null;
    await this.faceMesh.send({ image: imageElement });
  }
}

export default new MediaPipeService();


