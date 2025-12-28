import React from 'react';
import { X, Save } from 'lucide-react';

const AvatarEditor = ({ config, onConfigChange, onSave, onClose }) => {
  const updateConfig = (key, value) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Customize Your Avatar</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Skin Tone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skin Tone
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.skinTone}
                onChange={(e) => updateConfig('skinTone', e.target.value)}
                className="w-20 h-12 rounded border cursor-pointer"
              />
              <div className="flex-1 grid grid-cols-6 gap-2">
                {['#ffd7ba', '#f0d5b8', '#d4a574', '#c68642', '#8d5524', '#613d24'].map(color => (
                  <button
                    key={color}
                    onClick={() => updateConfig('skinTone', color)}
                    className="w-full h-12 rounded border-2"
                    style={{ 
                      backgroundColor: color,
                      borderColor: config.skinTone === color ? '#2563eb' : '#d1d5db'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Body Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Body Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['slim', 'average', 'athletic'].map(type => (
                <button
                  key={type}
                  onClick={() => updateConfig('bodyType', type)}
                  className={`py-3 px-4 rounded border-2 font-medium capitalize ${
                    config.bodyType === type
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Hair Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hair Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['short', 'long', 'curly', 'bald', 'ponytail'].map(style => (
                <button
                  key={style}
                  onClick={() => updateConfig('hairStyle', style)}
                  className={`py-3 px-4 rounded border-2 font-medium capitalize ${
                    config.hairStyle === style
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Hair Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hair Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.hairColor}
                onChange={(e) => updateConfig('hairColor', e.target.value)}
                className="w-20 h-12 rounded border cursor-pointer"
              />
              <div className="flex-1 grid grid-cols-6 gap-2">
                {['#000000', '#4a3728', '#8b4513', '#daa520', '#ff0000', '#ffffff'].map(color => (
                  <button
                    key={color}
                    onClick={() => updateConfig('hairColor', color)}
                    className="w-full h-12 rounded border-2"
                    style={{ 
                      backgroundColor: color,
                      borderColor: config.hairColor === color ? '#2563eb' : '#d1d5db'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Clothing Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clothing Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['casual', 'formal', 'sporty'].map(style => (
                <button
                  key={style}
                  onClick={() => updateConfig('clothing', style)}
                  className={`py-3 px-4 rounded border-2 font-medium capitalize ${
                    config.clothing === style
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Clothing Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clothing Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.clothingColor}
                onChange={(e) => updateConfig('clothingColor', e.target.value)}
                className="w-20 h-12 rounded border cursor-pointer"
              />
              <div className="flex-1 grid grid-cols-6 gap-2">
                {['#4a90e2', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#34495e'].map(color => (
                  <button
                    key={color}
                    onClick={() => updateConfig('clothingColor', color)}
                    className="w-full h-12 rounded border-2"
                    style={{ 
                      backgroundColor: color,
                      borderColor: config.clothingColor === color ? '#2563eb' : '#d1d5db'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={onSave}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
          >
            <Save size={20} />
            Save Avatar Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarEditor;
