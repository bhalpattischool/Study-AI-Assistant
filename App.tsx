
import React, { useState, useEffect } from 'react';
import { Mode, Role, Message, Conversation, Settings, TTSVoice } from './types';
import * as geminiService from './services/geminiService';
import { decodeAudioData } from './utils/audio';
import { decode } from './utils/audio';

import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import ChatInput from './components/ChatInput';
import HandsFreeMode from './components/HandsFreeMode';
import SettingsModal from './components/SettingsModal';
import NamePromptModal from './components/NamePromptModal';
import { MenuIcon } from './components/icons';

type TTSState = {
  messageId: string | null;
  status: 'idle' | 'loading' | 'playing';
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeMode, setActiveMode] = useState<Mode>(Mode.STANDARD);
  const [isLoading, setIsLoading] = useState(false);
  const [isHandsFree, setIsHandsFree] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [currentAudioSource, setCurrentAudioSource] = useState<AudioBufferSourceNode | null>(null);
  const [ttsState, setTtsState] = useState<TTSState>({ messageId: null, status: 'idle' });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    theme: 'dark',
    ttsVoice: TTSVoice.KORE,
    showWebSearch: true,
    showDeepThinking: true,
    userName: undefined,
    memory: [],
  });

  const [isNamePromptOpen, setIsNamePromptOpen] = useState(false);
  const [hasHadFirstInteraction, setHasHadFirstInteraction] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(prev => ({ ...prev, ...parsedSettings, memory: parsedSettings.memory || [] }));
      // If a user name exists, we know they've interacted before, so don't show the prompt.
      if (parsedSettings.userName) {
        setHasHadFirstInteraction(true);
      }
    }
  }, []);

  // Save settings and apply theme
  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    const savedConversations = localStorage.getItem('chatHistory');
    if (savedConversations) {
      setConversations(JSON.parse(savedConversations));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(conversations));
  }, [conversations]);

  const handleSendMessage = async (prompt: string, modeOverride?: Mode) => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
    const currentMode = modeOverride || activeMode;
    if (modeOverride && !currentConversationId) {
      setActiveMode(modeOverride);
    }
    setIsLoading(true);

    const userMessage: Message = { id: Date.now().toString(), role: Role.USER, content: prompt, mode: currentMode };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    let conversationId = currentConversationId;
    if (!conversationId) {
        conversationId = `convo-${Date.now()}`;
        setCurrentConversationId(conversationId);
        const newConversation: Conversation = {
            id: conversationId,
            title: prompt.substring(0, 30) + (prompt.length > 30 ? '...' : ''),
            messages: newMessages
        };
        setConversations(prev => [newConversation, ...prev]);
    } else {
        setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, messages: newMessages } : c));
    }

    try {
      let response: { text: string; sources?: any[] };
      const history = newMessages.slice(0, -1);

      switch (currentMode) {
        case Mode.SEARCH:
          response = await geminiService.getSearchResponse(prompt, history, settings);
          break;
        case Mode.THINKING:
          response = await geminiService.getThinkingResponse(prompt, history, settings);
          break;
        case Mode.LITE:
          response = await geminiService.getLiteResponse(prompt, history, settings);
          break;
        default:
          response = await geminiService.getStandardResponse(prompt, history, settings);
      }
      
      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        content: response.text,
        sources: response.sources,
        mode: currentMode,
      };
      
      const finalMessages = [...newMessages, modelMessage];
      setMessages(finalMessages);
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, messages: finalMessages } : c));

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        content: "Sorry, I encountered an error. Please try again.",
        mode: currentMode,
      };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, messages: finalMessages } : c));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePlayTTS = async (text: string, messageId: string) => {
    if (currentAudioSource) {
      currentAudioSource.stop();
      setCurrentAudioSource(null);
    }

    if (ttsState.messageId === messageId) {
      setTtsState({ messageId: null, status: 'idle' });
      return;
    }

    setTtsState({ messageId, status: 'loading' });
    
    const ctx = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    setAudioContext(ctx);

    try {
      const base64Audio = await geminiService.getTextToSpeech(text, settings.ttsVoice);
      if (base64Audio) {
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => {
          setTtsState({ messageId: null, status: 'idle' });
          setCurrentAudioSource(null);
        };
        source.start();
        setCurrentAudioSource(source);
        setTtsState({ messageId, status: 'playing' });
      } else {
        setTtsState({ messageId: null, status: 'idle' });
      }
    } catch (error) {
      console.error("Error with TTS:", error);
      setTtsState({ messageId: null, status: 'idle' });
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setActiveMode(Mode.STANDARD);
    if (isSidebarOpen) setIsSidebarOpen(false);
  };

  const handleLoadConversation = (id: string) => {
    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
        setCurrentConversationId(id);
        setMessages(conversation.messages);
        const lastMode = conversation.messages[conversation.messages.length - 1]?.mode || Mode.STANDARD;
        setActiveMode(lastMode);
        if (isSidebarOpen) setIsSidebarOpen(false);
    }
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
        handleNewChat();
    }
  };

  const handleSettingsChange = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleFirstInteraction = () => {
    if (!hasHadFirstInteraction) {
      setIsNamePromptOpen(true);
      setHasHadFirstInteraction(true);
    }
  };

  const handleSaveName = (name: string) => {
    handleSettingsChange({ userName: name });
    setIsNamePromptOpen(false);
  };
  
  const handleHandsFreeExit = (voiceMessages: Message[]) => {
    setIsHandsFree(false);
    if (voiceMessages.length > 0) {
      const newConversation: Conversation = {
        id: `convo-${Date.now()}`,
        title: `(Voice) ${voiceMessages[0].content.substring(0, 25)}${voiceMessages[0].content.length > 25 ? '...' : ''}`,
        messages: voiceMessages,
      };
      setConversations(prev => [newConversation, ...prev]);
    }
  };

  return (
    <div className="h-screen w-screen bg-white dark:bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-gray-900 dark:text-white flex overflow-hidden">
      <Sidebar
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        isSidebarOpen={isSidebarOpen}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        onLoadConversation={handleLoadConversation}
        onDeleteConversation={handleDeleteConversation}
        onOpenSettings={() => setIsSettingsOpen(true)}
        settings={settings}
      />
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="flex-1 flex flex-col relative bg-white dark:bg-black/20">
        <div className="absolute top-0 left-0 p-2 md:hidden z-20">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10">
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>
        
        <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onSettingsChange={handleSettingsChange}
        />

        {isNamePromptOpen && (
          <NamePromptModal
            onClose={() => setIsNamePromptOpen(false)}
            onSave={handleSaveName}
          />
        )}

        {isHandsFree ? (
            <HandsFreeMode 
                onExit={handleHandsFreeExit} 
                settings={settings} 
            />
        ) : (
            <>
              <ChatView
                messages={messages}
                isLoading={isLoading}
                activeMode={activeMode}
                onPlayTTS={handlePlayTTS}
                onSendMessage={handleSendMessage}
                ttsState={ttsState}
              />
              <ChatInput 
                onSendMessage={handleSendMessage} 
                isLoading={isLoading} 
                onToggleHandsFree={() => setIsHandsFree(true)}
                onFirstInteraction={handleFirstInteraction} 
              />
            </>
        )}
      </main>
    </div>
  );
};

export default App;