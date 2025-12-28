import * as tf from '@tensorflow/tfjs';

class SignRecognitionService {
  constructor() {
    this.model = null;
    this.sequenceLength = 30;
    this.gestureBuffer = [];
    this.signDictionary = {
      0: 'Hello',
      1: 'Thank you',
      2: 'Yes',
      3: 'No',
      4: 'Please',
      5: 'Help',
      6: 'Sorry',
      7: 'Good',
      8: 'Bad',
      9: 'Question'
    };
  }

  async loadModel() {
    try {
      // In production, load pre-trained model
      // this.model = await tf.loadLayersModel('/models/sign-recognition/model.json');
      
      // For demo, create a simple model
      this.model = this.createDemoModel();
      console.log('Sign recognition model loaded');
    } catch (error) {
      console.error('Error loading model:', error);
    }
  }

  createDemoModel() {
    const model = tf.sequential();
    model.add(tf.layers.lstm({
      units: 128,
      returnSequences: true,
      inputShape: [this.sequenceLength, 150] // 150 features per frame
    }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.lstm({ units: 64 }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 10, activation: 'softmax' }));
    
    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }

  extractFeatures(handLandmarks, poseLandmarks, faceLandmarks) {
    const features = [];

    // Hand features (21 landmarks * 3 coordinates * 2 hands = 126 features)
    if (handLandmarks) {
      handLandmarks.forEach(hand => {
        if (hand.landmarks) {
          hand.landmarks.forEach(landmark => {
            features.push(landmark.x, landmark.y, landmark.z);
          });
        } else {
          // Pad with zeros if hand not detected
          for (let i = 0; i < 63; i++) features.push(0);
        }
      });
    }

    // Pose features (selected 8 key points * 3 = 24 features)
    if (poseLandmarks && poseLandmarks.length > 0) {
      const keyPoints = [11, 12, 13, 14, 15, 16, 23, 24]; // Shoulders, elbows, wrists, hips
      keyPoints.forEach(idx => {
        if (poseLandmarks[idx]) {
          features.push(
            poseLandmarks[idx].x,
            poseLandmarks[idx].y,
            poseLandmarks[idx].z
          );
        } else {
          features.push(0, 0, 0);
        }
      });
    }

    // Total: 126 + 24 = 150 features
    return features;
  }

  addFrame(handLandmarks, poseLandmarks, faceLandmarks) {
    const features = this.extractFeatures(handLandmarks, poseLandmarks, faceLandmarks);
    
    this.gestureBuffer.push(features);
    if (this.gestureBuffer.length > this.sequenceLength) {
      this.gestureBuffer.shift();
    }

    return this.gestureBuffer.length >= this.sequenceLength;
  }

  async recognizeSign() {
    if (!this.model || this.gestureBuffer.length < this.sequenceLength) {
      return null;
    }

    try {
      // Prepare input tensor
      const inputTensor = tf.tensor3d([this.gestureBuffer]);
      
      // Get prediction
      const prediction = this.model.predict(inputTensor);
      const predictionData = await prediction.data();
      
      // Get class with highest confidence
      const maxConfidence = Math.max(...predictionData);
      const predictedClass = predictionData.indexOf(maxConfidence);
      
      inputTensor.dispose();
      prediction.dispose();

      // Only return if confidence is above threshold
      if (maxConfidence > 0.7) {
        return {
          sign: this.signDictionary[predictedClass] || 'Unknown',
          confidence: maxConfidence
        };
      }

      return null;
    } catch (error) {
      console.error('Recognition error:', error);
      return null;
    }
  }

  clearBuffer() {
    this.gestureBuffer = [];
  }
}

export default new SignRecognitionService();