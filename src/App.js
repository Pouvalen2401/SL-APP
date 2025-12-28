import React, { useState, useEffect, useRef } from 'react';
import { Camera, User, Settings, Hand, MessageSquare, Download, Upload } from 'lucide-react';
import CameraInput from './components/CameraInput';
import AvatarRenderer from './components/AvatarRenderer';
import AvatarEditor from './components/AvatarEditor';
import signRecognition from './services/signRecognition';
import faceRecognition from './services/faceRecognition';
import ticFilter from './services/ticFilter';
import indexedDBService from './services/indexedDBService';

function App() {
  const [activeTab, setActiveTab] = useState('translate');
  const [isRecording, setIsRecording] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [detectedMood, setDetectedMood] = useState('neutral');
  const [gestureData, setGestureData] = useState(null);
  
  const [avatarConfig, setAvatarConfig] = useState({
    skinTone: '#f0d5b8',
    hairStyle: 'short',
    hairColor: '#4a3728',
    clothing: 'casual',
    clothingColor: '#4a90e2',
    bodyType: 'average'
  });

  const [users, setUsers] = useState([]);
  const [detectionStatus, setDetectionStatus] = useState({
    hand: false,
    pose: false,
    face: false
  });

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Load users from IndexedDB
    const loadedUsers = await indexedDBService.getAllUsers();
    setUsers(loadedUsers);

    // Initialize ML models
    await signRecognition.loadModel();
    await faceRecognition.loadKnownFaces(loadedUsers);
  };

  const handleHandsDetected = (hands, handedness) => {
    setDetectionStatus(prev => ({ ...prev, hand: true }));
    
    // Filter tics if user is identified
    let filteredHands = hands;
    if (currentUser && currentUser.tics) {
      // Tic filtering logic would go here
    }

    // Add to gesture sequence
    const isReady = signRecognition.addFrame(filteredHands, null, null);
    
    if (isReady) {
      recognizeCurrentSign();
    }

    // Update gesture data for avatar
    setGestureData(prev => ({
      ...prev,
      hands: filteredHands,
      handShape: extractHandShape(filteredHands)
    }));
  };

  const handlePoseDetected = (pose) => {
    setDetectionStatus(prev => ({ ...prev, pose: true }));
    
    // Filter postural tics
    let filteredPose = pose;
    if (currentUser && currentUser.tics) {
      filteredPose = ticFilter.filterPosturalTics(pose, currentUser.tics);
    }

    setGestureData(prev => ({
      ...prev,
      pose: filteredPose
    }));
  };

  const handleFaceDetected = (face) => {
    setDetectionStatus(prev => ({ ...prev, face: true }));
    
    // Detect mood from facial expression
    const mood = analyzeMood(face);
    setDetectedMood(mood);

    // Filter facial tics
    let filteredFace = face;
    if (currentUser && currentUser.tics) {
      filteredFace = ticFilter.filterFacialTics(face, currentUser.tics);
    }

    // Recognize user if not already identified
    if (!currentUser) {
      const recognized = faceRecognition.recognizeUser(face);
      if (recognized) {
        setCurrentUser(recognized.user);
        loadUserAvatar(recognized.user.id);
      }
    }
  };

  const recognizeCurrentSign = async () => {
    const result = await signRecognition.recognizeSign();
    if (result) {
      setTranslatedText(prev => 
        prev ? `${prev} ${result.sign}` : result.sign
      );

      // Save translation
      if (currentUser) {
        await indexedDBService.saveTranslation({
          userId: currentUser.id,
          inputType: 'sign',
          outputData: result.sign,
          confidence: result.confidence
        });
      }
    }
  };

  const extractHandShape = (hands) => {
    if (!hands || hands.length === 0) return null;
    
    const shapes = {};
    hands.forEach((hand, idx) => {
      const side = idx === 0 ? 'left' : 'right';
      shapes[side] = {
        thumb: hand[4].y < hand[3].y ? 'extended' : 'folded',
        index: hand[8].y < hand[6].y ? 'extended' : 'folded',
        middle: hand[12].y < hand[10].y ? 'extended' : 'folded',
        ring: hand[16].y < hand[14].y ? 'extended' : 'folded',
        pinky: hand[20].y < hand[18].y ? 'extended' : 'folded'
      };
    });
    return shapes;
  };

  const analyzeMood = (faceLandmarks) => {
    if (!faceLandmarks || faceLandmarks.length < 468) return 'neutral';
    
    // Simplified mood detection
    const leftEyebrow = faceLandmarks[70];
    const rightEyebrow = faceLandmarks[300];
    const upperLip = faceLandmarks[13];
    const lowerLip = faceLandmarks[14];
    
    const mouthOpen = Math.abs(upperLip.y - lowerLip.y);
    const eyebrowHeight = (leftEyebrow.y + rightEyebrow.y) / 2;
    
    if (mouthOpen > 0.05 && eyebrowHeight < 0.3) return 'surprised';
    if (mouthOpen > 0.03) return 'happy';
    if (eyebrowHeight > 0.35) return 'sad';
    
    return 'neutral';
  };

  const loadUserAvatar = async (userId) => {
    const avatar = await indexedDBService.getAvatar(userId);
    if (avatar && avatar.config) {
      setAvatarConfig(avatar.config);
    }
  };

  const saveAvatarConfig = async () => {
    if (currentUser) {
      await indexedDBService.saveAvatar(currentUser.id, avatarConfig);
      setShowAvatarEditor(false);
    }
  };

  const textToSign = async () => {
    if (!inputText.trim()) return;
    
    setTranslatedText(`Converting: "${inputText}"`);
    
    // Simulate text-to-sign animation
    const words = inputText.split(' ');
    for (const word of words) {
      await animateWord(word);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    setTranslatedText('Sign animation complete');
    
    // Save translation
    if (currentUser) {
      await indexedDBService.saveTranslation({
        userId: currentUser.id,
        inputType: 'text',
        inputData: inputText,
        outputData: 'sign_animation'
      });
    }
    
    setInputText('');
  };

  const animateWord = async (word) => {
    // Simulate avatar animation for a word
    return new Promise(resolve => {
      let frame = 0;
      const interval = setInterval(() => {
        setGestureData(prev => ({
          ...prev,
          animationFrame: frame++
        }));
        
        if (frame > 15) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  };

  const exportUserData = () => {
    const data = {
      users,
      currentUser,
      avatarConfig,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signbridge-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importUserData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.users) {
          for (const user of data.users) {
            await indexedDBService.saveUser(user);
          }
          setUsers(data.users);
        }
        if (data.avatarConfig) {
          setAvatarConfig(data.avatarConfig);
        }
        alert('Data imported successfully!');
      } catch (error) {
        alert('Failed to import data: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Hand size={32} />
            <h1 className="text-2xl font-bold">SignBridge</h1>
          </div>
          {currentUser && (
            <div className="bg-blue-700 px-4 py-2 rounded-full flex items-center gap-2">
              <User size={20} />
              <span className="text-sm font-medium">{currentUser.name}</span>
            </div>
          )}
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-6xl mx-auto flex">
          <button
            onClick={() => setActiveTab('translate')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium ${
              activeTab === 'translate' 
                ? 'border-b-4 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Camera size={20} />
            Translate
          </button>
          <button
            onClick={() => setActiveTab('avatar')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium ${
              activeTab === 'avatar' 
                ? 'border-b-4 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <User size={20} />
            Avatar
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium ${
              activeTab === 'settings' 
                ? 'border-b-4 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Settings size={20} />
            Settings
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4">
        {activeTab === 'translate' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Camera Input Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Camera size={24} />
                Sign Language Input
              </h2>
              
              <div className="mb-4" style={{ height: '360px' }}>
                <CameraInput
                  isRecording={isRecording}
                  onHandsDetected={handleHandsDetected}
                  onPoseDetected={handlePoseDetected}
                  onFaceDetected={handleFaceDetected}
                />
              </div>

              {/* Detection Status */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className={`p-3 rounded text-center text-sm font-medium ${
                  detectionStatus.hand 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Hand size={16} className="mx-auto mb-1" />
                  Hand
                </div>
                <div className={`p-3 rounded text-center text-sm font-medium ${
                  detectionStatus.pose 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <User size={16} className="mx-auto mb-1" />
                  Pose
                </div>
                <div className={`p-3 rounded text-center text-sm font-medium ${
                  detectionStatus.face 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Camera size={16} className="mx-auto mb-1" />
                  Face
                </div>
              </div>

              {/* Mood Display */}
              {detectedMood && detectedMood !== 'neutral' && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4">
                  <p className="text-sm">
                    <span className="font-semibold">Detected Mood:</span>{' '}
                    <span className="capitalize">{detectedMood}</span>
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  setIsRecording(!isRecording);
                  if (isRecording) {
                    signRecognition.clearBuffer();
                  }
                }}
                className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isRecording ? (
                  <>
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Camera size={20} />
                    Start Detection
                  </>
                )}
              </button>

              {/* Translation Output */}
              {translatedText && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1 font-medium">Translated Text:</p>
                  <p className="text-lg font-semibold text-green-800">{translatedText}</p>
                  <button
                    onClick={() => setTranslatedText('')}
                    className="mt-2 text-sm text-green-600 hover:text-green-800"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Avatar Output Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <User size={24} />
                  Avatar Output
                </h2>
                <button
                  onClick={() => setShowAvatarEditor(true)}
                  className="text-blue-600 hover:text-blue-700 transition"
                >
                  <Settings size={20} />
                </button>
              </div>

              <div className="mb-4" style={{ height: '360px' }}>
                <AvatarRenderer
                  config={avatarConfig}
                  mood={detectedMood}
                  gestureData={gestureData}
                />
              </div>

              {/* Text to Sign Input */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Convert Text to Sign Language
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
                <button
                  onClick={textToSign}
                  disabled={!inputText.trim()}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                >
                  <MessageSquare size={20} />
                  Generate Sign Animation
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'avatar' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Avatar Customization</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-4 text-lg">Preview</h3>
                <div style={{ height: '400px' }}>
                  <AvatarRenderer
                    config={avatarConfig}
                    mood={detectedMood}
                    gestureData={gestureData}
                  />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4 text-lg">Customize</h3>
                <button
                  onClick={() => setShowAvatarEditor(true)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Open Avatar Editor
                </button>
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Features:</p>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Customizable skin tone with preset options</li>
                    <li>• Multiple body types (slim, average, athletic)</li>
                    <li>• 5+ hair styles with custom colors</li>
                    <li>• Clothing style and color preferences</li>
                    <li>• Real-time expression synchronization</li>
                    <li>• Gesture-based arm and hand animation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            
            <div className="space-y-8">
              {/* User Management */}
              <div>
                <h3 className="font-semibold mb-4 text-lg">User Management</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current User
                    </label>
                    {currentUser ? (
                      <div className="p-4 bg-blue-50 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{currentUser.name}</p>
                          {currentUser.tics && currentUser.tics.length > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              {currentUser.tics.length} tic(s) filtered
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setCurrentUser(null)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Sign Out
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm">
                        No user identified. Start recording to enable face recognition.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registered Users ({users.length})
                    </label>
                    <div className="border border-gray-300 rounded-lg divide-y max-h-40 overflow-y-auto">
                      {users.map(user => (
                        <div key={user.id} className="p-3 hover:bg-gray-50 flex justify-between items-center">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-gray-500">
                              {user.tics?.length || 0} tic patterns
                            </p>
                          </div>
                          <button
                            onClick={() => setCurrentUser(user)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Select
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tic Filtering */}
              {currentUser && (
                <div>
                  <h3 className="font-semibold mb-4 text-lg">Tic Detection & Filtering</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    The system automatically filters out registered tics to improve the accuracy of non-manual markers and sign recognition.
                  </p>
                  {currentUser.tics && currentUser.tics.length > 0 ? (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <p className="text-sm font-semibold mb-3">Your Registered Tics:</p>
                      <div className="flex flex-wrap gap-2">
                        {currentUser.tics.map((tic, idx) => (
                          <span 
                            key={idx} 
                            className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                          >
                            {tic.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 italic">
                      No tics registered for this user.
                    </p>
                  )}
                </div>
              )}

              {/* Detection Settings */}
              <div>
                <h3 className="font-semibold mb-4 text-lg">Detection Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm">Enable hand gesture tracking</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm">Enable facial expression analysis</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm">Enable body pose tracking</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm">Enable mood detection</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm">Enable automatic face recognition</span>
                  </label>
                </div>
              </div>

              {/* Data Management */}
              <div>
                <h3 className="font-semibold mb-4 text-lg">Data Management</h3>
                <div className="flex gap-3">
                  <button
                    onClick={exportUserData}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition"
                  >
                    <Download size={20} />
                    Export Data
                  </button>
                  <label className="flex-1">
                    <input
                      type="file"
                      accept=".json"
                      onChange={importUserData}
                      className="hidden"
                    />
                    <div className="bg-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition cursor-pointer">
                      <Upload size={20} />
                      Import Data
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Avatar Editor Modal */}
      {showAvatarEditor && (
        <AvatarEditor
          config={avatarConfig}
          onConfigChange={setAvatarConfig}
          onSave={saveAvatarConfig}
          onClose={() => setShowAvatarEditor(false)}
        />
      )}

      {/* System Info Footer */}
      <footer className="max-w-6xl mx-auto p-4 mt-8 mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-lg mb-4">System Architecture</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="font-semibold mb-2 text-blue-900">Web APIs</p>
              <ul className="space-y-1 text-gray-700">
                <li>• MediaDevices (Camera)</li>
                <li>• MediaPipe Hands</li>
                <li>• MediaPipe Pose</li>
                <li>• MediaPipe Face Mesh</li>
                <li>• Canvas 2D Rendering</li>
                <li>• IndexedDB Storage</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2 text-blue-900">Machine Learning</p>
              <ul className="space-y-1 text-gray-700">
                <li>• TensorFlow.js</li>
                <li>• LSTM Networks</li>
                <li>• Real-time Inference</li>
                <li>• Pattern Recognition</li>
                <li>• Tic Filtering</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2 text-blue-900">Features</p>
              <ul className="space-y-1 text-gray-700">
                <li>• Bidirectional Translation</li>
                <li>• Face Recognition</li>
                <li>• Mood Detection</li>
                <li>• Custom Avatars</li>
                <li>• PWA (Offline Mode)</li>
                <li>• Data Export/Import</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
