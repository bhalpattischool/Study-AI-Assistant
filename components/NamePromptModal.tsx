
import React, { useState } from 'react';
import { CloseIcon } from './icons';

interface NamePromptModalProps {
  onSave: (name: string) => void;
  onClose: () => void;
}

const NamePromptModal: React.FC<NamePromptModalProps> = ({ onSave, onClose }) => {
  const [name, setName] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="bg-gray-100 dark:bg-[#1A1A2E] text-gray-900 dark:text-white w-full max-w-sm m-4 rounded-xl shadow-2xl p-6 border border-black/10 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">A Personal Touch</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          What should we call you? Providing a name helps us personalize your experience. (Optional)
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your name"
          className="w-full p-3 rounded-lg bg-white dark:bg-[#2E2E48] border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            Skip
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 text-white transition-all transform hover:scale-105" disabled={!name.trim()}>
            Save Name
          </button>
        </div>
      </div>
    </div>
  );
};

export default NamePromptModal;
