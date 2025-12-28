import React, { useRef, useEffect } from 'react';

const AvatarRenderer = ({ config, mood, gestureData }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    drawAvatar();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [config, mood, gestureData]);

  const drawAvatar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = 150;
    const centerY = 150;

    // Draw body
    drawBody(ctx, centerX, centerY);
    
    // Draw arms with gesture
    drawArms(ctx, centerX, centerY, gestureData);
    
    // Draw head
    drawHead(ctx, centerX, 120);
    
    // Draw hair
    drawHair(ctx, centerX, 120);
    
    // Draw face with mood
    drawFace(ctx, centerX, 120, mood);
    
    // Draw hands
    drawHands(ctx, centerX, gestureData);
  };

  const drawBody = (ctx, x, y) => {
    ctx.fillStyle = config.clothingColor;
    
    // Torso
    const bodyWidth = config.bodyType === 'slim' ? 80 : 
                      config.bodyType === 'athletic' ? 100 : 90;
    ctx.fillRect(x - bodyWidth/2, 180, bodyWidth, 120);
    
    // Add clothing details
    if (config.clothing === 'formal') {
      // Draw collar
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 20, 180, 40, 15);
    } else if (config.clothing === 'sporty') {
      // Draw stripes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x - bodyWidth/2 + 10, 200, bodyWidth - 20, 5);
    }
  };

  const drawArms = (ctx, x, y, gesture) => {
    ctx.strokeStyle = config.skinTone;
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';

    // Calculate arm positions based on gesture data
    let leftArmAngle = 0.5;
    let rightArmAngle = -0.5;
    let leftElbowX = x - 70;
    let leftElbowY = 250;
    let rightElbowX = x + 70;
    let rightElbowY = 250;

    if (gesture && gesture.handPosition) {
      // Adjust arm position based on hand tracking
      leftElbowX = x - 50 + (gesture.handPosition.left?.x || 0) * 50;
      leftElbowY = 220 + (gesture.handPosition.left?.y || 0) * 80;
      rightElbowX = x + 50 + (gesture.handPosition.right?.x || 0) * 50;
      rightElbowY = 220 + (gesture.handPosition.right?.y || 0) * 80;
    }

    // Left arm
    ctx.beginPath();
    ctx.moveTo(x - 45, 200);
    ctx.lineTo(leftElbowX, leftElbowY);
    ctx.stroke();

    // Right arm
    ctx.beginPath();
    ctx.moveTo(x + 45, 200);
    ctx.lineTo(rightElbowX, rightElbowY);
    ctx.stroke();
  };

  const drawHead = (ctx, x, y) => {
    ctx.fillStyle = config.skinTone;
    ctx.beginPath();
    ctx.arc(x, y, 50, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    ctx.fillRect(x - 15, y + 35, 30, 25);
  };

  const drawHair = (ctx, x, y) => {
    ctx.fillStyle = config.hairColor;

    switch (config.hairStyle) {
      case 'short':
        ctx.fillRect(x - 50, y - 50, 100, 30);
        break;
      
      case 'long':
        ctx.fillRect(x - 55, y - 50, 110, 100);
        break;
      
      case 'curly':
        for (let i = 0; i < 12; i++) {
          ctx.beginPath();
          ctx.arc(x - 50 + i * 10, y - 40 + (i % 2) * 10, 12, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      
      case 'bald':
        // No hair
        break;
      
      case 'ponytail':
        ctx.fillRect(x - 50, y - 50, 100, 30);
        ctx.fillRect(x - 10, y + 50, 20, 60);
        break;
    }
  };

  const drawFace = (ctx, x, y, mood) => {
    // Eyes
    ctx.fillStyle = '#000';
    const eyeY = y - 10;
    
    if (mood === 'surprised') {
      // Wide eyes
      ctx.beginPath();
      ctx.arc(x - 20, eyeY, 8, 0, Math.PI * 2);
      ctx.arc(x + 20, eyeY, 8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Normal eyes
      ctx.beginPath();
      ctx.arc(x - 20, eyeY, 5, 0, Math.PI * 2);
      ctx.arc(x + 20, eyeY, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Eyebrows
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    switch (mood) {
      case 'happy':
        ctx.beginPath();
        ctx.moveTo(x - 30, y - 20);
        ctx.lineTo(x - 10, y - 23);
        ctx.moveTo(x + 30, y - 20);
        ctx.lineTo(x + 10, y - 23);
        ctx.stroke();
        break;
      
      case 'sad':
        ctx.beginPath();
        ctx.moveTo(x - 30, y - 23);
        ctx.lineTo(x - 10, y - 20);
        ctx.moveTo(x + 30, y - 23);
        ctx.lineTo(x + 10, y - 20);
        ctx.stroke();
        break;
      
      case 'angry':
        ctx.beginPath();
        ctx.moveTo(x - 30, y - 25);
        ctx.lineTo(x - 10, y - 18);
        ctx.moveTo(x + 30, y - 25);
        ctx.lineTo(x + 10, y - 18);
        ctx.stroke();
        break;
      
      case 'surprised':
      case 'questioning':
        ctx.beginPath();
        ctx.arc(x - 20, y - 25, 10, 0.2, Math.PI - 0.2);
        ctx.arc(x + 20, y - 25, 10, 0.2, Math.PI - 0.2);
        ctx.stroke();
        break;
      
      default:
        ctx.beginPath();
        ctx.moveTo(x - 30, y - 20);
        ctx.lineTo(x - 10, y - 20);
        ctx.moveTo(x + 30, y - 20);
        ctx.lineTo(x + 10, y - 20);
        ctx.stroke();
    }

    // Mouth
    ctx.beginPath();
    switch (mood) {
      case 'happy':
        ctx.arc(x, y + 20, 25, 0, Math.PI);
        break;
      
      case 'sad':
        ctx.arc(x, y + 30, 25, Math.PI, 0);
        break;
      
      case 'surprised':
        ctx.arc(x, y + 20, 12, 0, Math.PI * 2);
        break;
      
      case 'angry':
        ctx.moveTo(x - 25, y + 25);
        ctx.lineTo(x + 25, y + 25);
        break;
      
      default:
        ctx.moveTo(x - 20, y + 20);
        ctx.lineTo(x + 20, y + 20);
    }
    ctx.stroke();
  };

  const drawHands = (ctx, x, gesture) => {
    ctx.fillStyle = config.skinTone;

    let leftHandX = x - 70;
    let leftHandY = 250;
    let rightHandX = x + 70;
    let rightHandY = 250;

    if (gesture && gesture.handPosition) {
      leftHandX = x - 50 + (gesture.handPosition.left?.x || 0) * 50;
      leftHandY = 220 + (gesture.handPosition.left?.y || 0) * 80;
      rightHandX = x + 50 + (gesture.handPosition.right?.x || 0) * 50;
      rightHandY = 220 + (gesture.handPosition.right?.y || 0) * 80;
    }

    // Draw hands
    ctx.beginPath();
    ctx.arc(leftHandX, leftHandY, 15, 0, Math.PI * 2);
    ctx.arc(rightHandX, rightHandY, 15, 0, Math.PI * 2);
    ctx.fill();

    // Draw fingers if gesture data available
    if (gesture && gesture.handShape) {
      drawFingers(ctx, leftHandX, leftHandY, gesture.handShape.left);
      drawFingers(ctx, rightHandX, rightHandY, gesture.handShape.right);
    }
  };

  const drawFingers = (ctx, x, y, handShape) => {
    if (!handShape) return;

    ctx.strokeStyle = config.skinTone;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    const fingerOffsets = [
      { angle: -0.6, name: 'thumb' },
      { angle: -0.3, name: 'index' },
      { angle: 0, name: 'middle' },
      { angle: 0.3, name: 'ring' },
      { angle: 0.6, name: 'pinky' }
    ];

    fingerOffsets.forEach(finger => {
      const extended = handShape[finger.name] === 'extended';
      const length = extended ? 20 : 10;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + Math.cos(finger.angle) * length,
        y - Math.abs(Math.sin(finger.angle)) * length - (extended ? 10 : 0)
      );
      ctx.stroke();
    });
  };

  return (
    <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={300}
        height={400}
        className="border border-gray-300 rounded"
      />
    </div>
  );
};

export default AvatarRenderer;