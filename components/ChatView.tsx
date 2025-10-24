
import React, { useEffect, useRef } from 'react';
import { Message as MessageType, Mode } from '../types';
import Message from './Message';
import { BrainIcon, SearchIcon, BoltIcon, StudyAiIcon } from './icons';

interface ChatViewProps {
  messages: MessageType[];
  isLoading: boolean;
  activeMode: Mode;
  onPlayTTS: (text: string, messageId: string) => void;
  onSendMessage: (message: string, mode: Mode) => void;
  ttsState: { messageId: string | null; status: 'idle' | 'loading' | 'playing' };
}

const WelcomeCard: React.FC<{ icon: React.ReactNode; title: string; text: string; onClick: () => void }> = ({ icon, title, text, onClick }) => (
    <button onClick={onClick} className="bg-gray-500/10 dark:bg-white/5 p-4 rounded-lg text-left w-full hover:bg-gray-500/20 dark:hover:bg-white/10 transition-colors">
        <div className="flex items-center gap-3">
            {icon}
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{text}</p>
    </button>
)

const ChatView: React.FC<ChatViewProps> = ({ messages, isLoading, activeMode, onPlayTTS, onSendMessage, ttsState }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const modeInfo = {
        [Mode.STANDARD]: { name: "Standard Mode", description: "Ready to assist with anything you need." },
        [Mode.SEARCH]: { name: "Web Search", description: "Searching the web for the latest information." },
        [Mode.THINKING]: { name: "Deep Thinking", description: "Engaging advanced reasoning for your query." },
        [Mode.LITE]: { name: "Low-Latency", description: "Providing lightning-fast responses." },
    }
    
    const welcomeCards = [
        {
            icon: <SearchIcon className="w-6 h-6 text-cyan-500 dark:text-cyan-300" />,
            title: "Search for current events",
            text: "What were the main outcomes of the latest G7 summit?",
            action: () => onSendMessage("What were the main outcomes of the latest G7 summit?", Mode.SEARCH)
        },
        {
            icon: <BrainIcon className="w-6 h-6 text-purple-500 dark:text-purple-300" />,
            title: "Engage in deep thought",
            text: "Explain the theory of relativity like I'm five.",
            action: () => onSendMessage("Explain the theory of relativity like I'm five.", Mode.THINKING)
        },
        {
            icon: <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"/>,
            title: "Draft a professional email",
            text: "Write a follow-up email after a job interview.",
            action: () => onSendMessage("Write a follow-up email after a job interview.", Mode.STANDARD)
        },
        {
            icon: <BoltIcon className="w-6 h-6 text-yellow-500 dark:text-yellow-300" />,
            title: "Get a quick answer",
            text: "What is the capital of Australia?",
            action: () => onSendMessage("What is the capital of Australia?", Mode.LITE)
        }
    ];

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col">
            <div className="max-w-3xl mx-auto w-full">
                <div className="sticky top-0 bg-white/80 dark:bg-black/20 backdrop-blur-sm z-10 py-2 mb-4">
                    <h2 className="text-lg font-semibold text-center text-gray-900 dark:text-white">{modeInfo[activeMode].name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{modeInfo[activeMode].description}</p>
                </div>
            </div>

            <div className="flex-1 flex justify-center">
                 <div className="max-w-3xl w-full mx-auto space-y-8">
                    {messages.length === 0 && !isLoading ? (
                        <div className="text-center pt-10">
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500 mb-2 animate-fade-in">Study AI</h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>How can I help you today?</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {welcomeCards.map((card, index) => (
                                    <div key={card.title} className="animate-slide-in-fade" style={{ animationDelay: `${index * 100 + 200}ms` }}>
                                        <WelcomeCard
                                            icon={card.icon}
                                            title={card.title}
                                            text={card.text}
                                            onClick={card.action}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <Message key={msg.id} message={msg} onPlayTTS={onPlayTTS} ttsState={ttsState} />
                        ))
                    )}
                    {isLoading && (
                         <div className="w-full flex justify-start animate-slide-in-fade">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 flex-shrink-0"><StudyAiIcon className="w-full h-full"/></div>
                                <div className="max-w-xl lg:max-w-2xl px-5 py-4 rounded-2xl bg-gray-200 dark:bg-[#2E2E48] rounded-bl-none flex items-center space-x-2">
                                   <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                                   <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
                                   <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={endOfMessagesRef} />
                </div>
            </div>
        </div>
    );
};

export default ChatView;
