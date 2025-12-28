import React, { useRef, useEffect, useState } from 'react';
import { Camera, Video } from 'lucide-react';
import mediaPipeService from '../services/mediaPipeService';

const CameraInput = ({ 
  isRecording, 
  onHandsDetected, 
  onPoseDetected, 
  onFaceDetected 
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isRecording) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isRecording]);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        
        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current.play();
          await initializeDetection();
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied. Please enable camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const initializeDetection = async () => {
    await mediaPipeService.initialize();

    // Set up callbacks
    mediaPipeService.setHandsCallback((results) => {
      if (results.multiHandLandmarks) {
        onHandsDetected(results.multiHandLandmarks, results.multiHandedness);
        drawHandLandmarks(results);
      }
    });

    mediaPipeService.setPoseCallback((results) => {
      if (results.poseLandmarks) {
        onPoseDetected(results.poseLandmarks);
        drawPoseLandmarks(results);
      }
    });

    mediaPipeService.setFaceMeshCallback((results) => {
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        onFaceDetected(results.multiFaceLandmarks[0]);
        drawFaceLandmarks(results);
      }
    });

    // Start detection loop
    detectFrame();
  };

  const detectFrame = async () => {
    if (!videoRef.current || !isRecording) return;

    await Promise.all([
      mediaPipeService.detectHands(videoRef.current),
      mediaPipeService.detectPose(videoRef.current),
      mediaPipeService.detectFace(videoRef.current)
    ]);

    requestAnimationFrame(detectFrame);
  };

  const drawHandLandmarks = (results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 5});
        drawLandmarks(ctx, landmarks, {color: '#FF0000', lineWidth: 2, radius: 5});
      }
    }

    ctx.restore();
  };

  const drawPoseLandmarks = (results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    if (results.poseLandmarks) {
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {color: '#0000FF', lineWidth: 4});
      drawLandmarks(ctx, results.poseLandmarks, {color: '#FF00FF', lineWidth: 2, radius: 4});
    }
  };

  const drawFaceLandmarks = (results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    if (results.multiFaceLandmarks) {
      for (const landmarks of results.multiFaceLandmarks) {
        drawConnectors(ctx, landmarks, FACEMESH_TESSELATION, {color: '#C0C0C070', lineWidth: 1});
      }
    }
  };

  const drawConnectors = (ctx, landmarks, connections, style) => {
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.lineWidth;

    for (const connection of connections) {
      const start = landmarks[connection[0]];
      const end = landmarks[connection[1]];

      ctx.beginPath();
      ctx.moveTo(start.x * ctx.canvas.width, start.y * ctx.canvas.height);
      ctx.lineTo(end.x * ctx.canvas.width, end.y * ctx.canvas.height);
      ctx.stroke();
    }
  };

  const drawLandmarks = (ctx, landmarks, style) => {
    ctx.fillStyle = style.color;

    for (const landmark of landmarks) {
      ctx.beginPath();
      ctx.arc(
        landmark.x * ctx.canvas.width,
        landmark.y * ctx.canvas.height,
        style.radius,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
      />
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-500 text-white p-3 rounded">
          {error}
        </div>
      )}
      {!isRecording && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <Camera size={64} className="text-white opacity-50" />
        </div>
      )}
    </div>
  );
};

export default CameraInput;


import { FaceMesh } from '@mediapipe/face_mesh';
import { Hands } from '@mediapipe/hands';
import { Pose } from '@mediapipe/pose'; 