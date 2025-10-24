
import React, { useState, useEffect } from 'react';
import { Settings, TTSVoice } from '../types';
import { CloseIcon, TrashIcon } from './icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const [localMemory, setLocalMemory] = useState<Array<{ key: string; value: string; }>>([]);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  
  useEffect(() => {
    // Sync local state when modal opens or settings from parent change
    if (isOpen) {
        setLocalMemory(settings.memory || []);
    }
  }, [isOpen, settings.memory]);

  if (!isOpen) return null;

  const ttsVoices = Object.values(TTSVoice);

  const handleToggle = (key: keyof Settings) => {
    onSettingsChange({ [key]: !settings[key] });
  };

  const handleMemoryChange = (index: number, field: 'key' | 'value', value: string) => {
    const newMemory = [...localMemory];
    newMemory[index] = { ...newMemory[index], [field]: value };
    setLocalMemory(newMemory);
  };

  const handleAddMemory = () => {
    setLocalMemory([...localMemory, { key: '', value: '' }]);
  };

  const handleDeleteMemory = (index: number) => {
    setLocalMemory(localMemory.filter((_, i) => i !== index));
  };

  const handleSaveMemory = () => {
    onSettingsChange({ memory: localMemory });
    setShowSaveConfirmation(true);
    setTimeout(() => {
        setShowSaveConfirmation(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div 
        className="bg-gray-100 dark:bg-[#1A1A2E] text-gray-900 dark:text-white w-full max-w-md m-4 rounded-xl shadow-2xl p-6 border border-black/10 dark:border-white/10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto pr-2 -mr-2">
          {/* Profile Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Profile</h3>
            <div>
                <label htmlFor="user-name" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Your Name</label>
                <input
                    id="user-name"
                    type="text"
                    placeholder="Enter your name for a personal touch"
                    value={settings.userName || ''}
                    onChange={(e) => onSettingsChange({ userName: e.target.value })}
                    className="w-full p-3 rounded-lg bg-white dark:bg-[#2E2E48] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
            </div>
          </div>

          {/* Long-Term Memory */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Long-Term Memory</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Help Study AI remember key facts about you for more personalized responses across all chats.
            </p>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 -mr-2">
                {localMemory.map((mem, index) => (
                    <div key={index} className="bg-white dark:bg-[#2E2E48]/60 p-4 rounded-lg relative group transition-colors border border-gray-300 dark:border-gray-600">
                        <button onClick={() => handleDeleteMemory(index)} className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-black/5 dark:hover:bg-white/10" aria-label="Delete memory item">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Key</label>
                            <input
                                type="text"
                                placeholder="e.g., Learning Style"
                                value={mem.key}
                                onChange={(e) => handleMemoryChange(index, 'key', e.target.value)}
                                className="w-full bg-transparent text-gray-800 dark:text-gray-100 focus:outline-none font-semibold text-base mt-1"
                            />
                        </div>
                        
                        <div className="mt-3">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Value</label>
                            <textarea
                                placeholder="e.g., Visual learner, prefers diagrams and charts."
                                value={mem.value}
                                rows={1}
                                onChange={(e) => handleMemoryChange(index, 'value', e.target.value)}
                                onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = `${target.scrollHeight}px`;
                                }}
                                className="w-full bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none resize-none text-sm leading-relaxed mt-1"
                            />
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center mt-4">
                <button
                    onClick={handleAddMemory}
                    className="text-sm text-blue-500 hover:text-blue-400 font-semibold"
                >
                    + Add Memory
                </button>
                <div className="flex items-center">
                    {showSaveConfirmation && <span className="text-sm text-green-500 mr-4 transition-opacity duration-300">Saved!</span>}
                    <button onClick={handleSaveMemory} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-colors">
                        Save Memory
                    </button>
                </div>
            </div>
          </div>

          {/* Theme Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Appearance</h3>
            <div className="flex gap-4">
              <button
                onClick={() => onSettingsChange({ theme: 'light' })}
                className={`flex-1 p-3 rounded-lg border-2 transition-colors ${settings.theme === 'light' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}
              >
                Light
              </button>
              <button
                onClick={() => onSettingsChange({ theme: 'dark' })}
                className={`flex-1 p-3 rounded-lg border-2 transition-colors ${settings.theme === 'dark' ? 'border-purple-500 bg-purple-500/10' : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'}`}
              >
                Dark
              </button>
            </div>
          </div>

          {/* Voice Settings */}
          <div>
            <label htmlFor="tts-voice" className="block text-lg font-semibold mb-3">Text-to-Speech Voice</label>
            <select
              id="tts-voice"
              value={settings.ttsVoice}
              onChange={(e) => onSettingsChange({ ttsVoice: e.target.value as TTSVoice })}
              className="w-full p-3 rounded-lg bg-white dark:bg-[#2E2E48] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {ttsVoices.map(voice => (
                <option key={voice} value={voice}>{voice}</option>
              ))}
            </select>
          </div>

          {/* Feature Toggles */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Features</h3>
            <div className="space-y-3">
                <ToggleSwitch
                    label="Enable Web Search Mode"
                    isChecked={settings.showWebSearch}
                    onToggle={() => handleToggle('showWebSearch')}
                />
                <ToggleSwitch
                    label="Enable Deep Thinking Mode"
                    isChecked={settings.showDeepThinking}
                    onToggle={() => handleToggle('showDeepThinking')}
                />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const ToggleSwitch: React.FC<{ label: string; isChecked: boolean; onToggle: () => void }> = ({ label, isChecked, onToggle }) => (
    <div className="flex items-center justify-between bg-gray-200 dark:bg-white/5 p-3 rounded-lg">
        <span>{label}</span>
        <button
            onClick={onToggle}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isChecked ? 'bg-blue-600' : 'bg-gray-400 dark:bg-gray-600'}`}
        >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isChecked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);


export default SettingsModal;
