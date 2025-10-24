
import React, { useState, useRef } from 'react';
import { SendIcon, MicIcon } from './icons';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onToggleHandsFree: () => void;
  onFirstInteraction: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, onToggleHandsFree, onFirstInteraction }) => {
  const [input, setInput] = useState('');
  const hasInteracted = useRef(false);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInteraction = () => {
    if (!hasInteracted.current) {
        onFirstInteraction();
        hasInteracted.current = true;
    }
  };

  return (
    <div className="bg-transparent p-4 md:p-6">
      <div className="max-w-3xl mx-auto flex items-center bg-gray-200 dark:bg-[#1A1A2E] rounded-xl p-2 border border-black/10 dark:border-white/10 shadow-lg">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInteraction}
          placeholder="Message Study AI..."
          className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none resize-none px-3 py-2"
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={onToggleHandsFree}
          disabled={isLoading}
          className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors disabled:opacity-50"
          aria-label="Toggle hands-free mode"
        >
          <MicIcon className="w-5 h-5" />
        </button>
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="p-2.5 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 text-white disabled:from-gray-400 disabled:to-gray-500 dark:disabled:from-gray-600 dark:disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 transform enabled:hover:scale-110"
          aria-label="Send message"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </div>
      <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-3">
        Study AI may display inaccurate info. Verify important information.
      </p>
    </div>
  );
};

export default ChatInput;