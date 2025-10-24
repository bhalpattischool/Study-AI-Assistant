
import React from 'react';
import { Mode, Conversation, Settings } from '../types';
import { SearchIcon, BrainIcon, BoltIcon, StudyAiIcon, PlusIcon, TrashIcon, SettingsIcon } from './icons';

interface SidebarProps {
  activeMode: Mode;
  setActiveMode: (mode: Mode) => void;
  isSidebarOpen: boolean;
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewChat: () => void;
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onOpenSettings: () => void;
  settings: Settings;
}

const allModes = [
  { id: Mode.STANDARD, name: 'Standard', icon: <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"/> },
  { id: Mode.SEARCH, name: 'Web Search', icon: <SearchIcon className="w-5 h-5 text-cyan-400 dark:text-cyan-300" /> },
  { id: Mode.THINKING, name: 'Deep Thinking', icon: <BrainIcon className="w-5 h-5 text-purple-500 dark:text-purple-300" /> },
  { id: Mode.LITE, name: 'Low-Latency', icon: <BoltIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-300" /> },
];

const Sidebar: React.FC<SidebarProps> = ({ 
  activeMode, setActiveMode, isSidebarOpen,
  conversations, currentConversationId, onNewChat, onLoadConversation, onDeleteConversation,
  onOpenSettings, settings
}) => {

  const visibleModes = allModes.filter(mode => {
    if (mode.id === Mode.SEARCH) return settings.showWebSearch;
    if (mode.id === Mode.THINKING) return settings.showDeepThinking;
    return true;
  });

  return (
    <div className={`absolute md:relative z-20 h-full bg-gray-100 dark:bg-[#1A1A2E] text-gray-900 dark:text-white transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-72 flex-shrink-0 p-4 flex flex-col border-r border-black/10 dark:border-gray-700/50`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
            <StudyAiIcon className="w-8 h-8"/>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
            Study AI
            </h1>
        </div>
        <button onClick={onNewChat} className="p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <PlusIcon className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex flex-col space-y-2 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">Modes</h2>
        {visibleModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            className={`flex items-center space-x-4 p-3 rounded-lg text-left transition-all duration-200 ease-in-out transform hover:scale-105 ${
              activeMode === mode.id ? 'bg-black/10 dark:bg-white/10 shadow-lg' : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            disabled={!!currentConversationId}
          >
            <div className="flex-shrink-0">{mode.icon}</div>
            <div>
              <p className="font-semibold">{mode.name}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex-grow overflow-y-auto pr-2 -mr-2">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">History</h2>
        <div className="flex flex-col space-y-1">
            {conversations.map((convo) => (
                <div key={convo.id} className="group flex items-center">
                    <button
                        onClick={() => onLoadConversation(convo.id)}
                        className={`w-full text-left p-2 rounded-md truncate transition-colors text-sm ${
                            currentConversationId === convo.id ? 'bg-black/20 dark:bg-white/20' : 'hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                    >
                        {convo.title}
                    </button>
                    <button 
                        onClick={() => onDeleteConversation(convo.id)}
                        className="p-1 opacity-0 group-hover:opacity-100 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-opacity ml-2 flex-shrink-0"
                        aria-label="Delete conversation"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-black/10 dark:border-gray-700/50">
          <button onClick={onOpenSettings} className="w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5">
              <SettingsIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              <span className="font-semibold">Settings</span>
          </button>
      </div>
    </div>
  );
};

export default Sidebar;