
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message as MessageType, Role, Source, Mode } from '../types';
import { VolumeUpIcon, StudyAiIcon, UserIcon, BrainIcon, CopyIcon, CheckIcon, ThumbsUpIcon, ThumbsDownIcon, LoadingSpinnerIcon, StopCircleIcon } from './icons';

interface MessageProps {
  message: MessageType;
  onPlayTTS: (text: string, messageId: string) => void;
  ttsState: { messageId: string | null; status: 'idle' | 'loading' | 'playing' };
}

const SourceLink: React.FC<{ source: Source }> = ({ source }) => (
    <a
        href={source.uri}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-black/5 dark:bg-black/20 hover:bg-black/10 dark:hover:bg-black/40 p-3 rounded-lg transition-colors text-sm border border-black/10 dark:border-white/10"
    >
        <span className="font-semibold text-blue-600 dark:text-cyan-300 block truncate">{source.title}</span>
        <span className="text-gray-500 dark:text-gray-400 text-xs block truncate">{source.uri}</span>
    </a>
);

const Message: React.FC<MessageProps> = ({ message, onPlayTTS, ttsState }) => {
  const isModel = message.role === Role.MODEL;
  const [isCopied, setIsCopied] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [showActions, setShowActions] = useState(false);

  const pressTimer = useRef<number | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  const isCurrentTtsMessage = ttsState.messageId === message.id;
  const isTtsLoading = isCurrentTtsMessage && ttsState.status === 'loading';
  const isTtsPlaying = isCurrentTtsMessage && ttsState.status === 'playing';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
          setShowActions(false); // Close menu after action
        }, 1500);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
  };
  
  const handleFeedback = (type: 'like' | 'dislike') => {
    setFeedback(type);
    setTimeout(() => setShowActions(false), 500); // Close menu after action
  }

  const handlePressStart = () => {
    pressTimer.current = window.setTimeout(() => {
      setShowActions(true);
    }, 750); // 750ms for a long press
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActions]);

  return (
    <div ref={messageRef} className={`flex items-start gap-3 w-full relative animate-slide-in-fade ${isModel ? '' : 'flex-row-reverse'}`}>
        <div className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center mt-1">
            {isModel ? <StudyAiIcon className="w-full h-full"/> : <UserIcon className="w-full h-full" />}
        </div>
        <div 
            className={`max-w-xl lg:max-w-2xl px-5 py-3 rounded-2xl relative select-none text-gray-900 dark:text-white ${isModel ? 'bg-gray-200 dark:bg-[#2E2E48] rounded-bl-none' : 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-none'}`}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
        >
             {showActions && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mt-[-8px] z-20 flex items-center gap-1 bg-black/70 dark:bg-black/50 backdrop-blur-sm p-1.5 rounded-full shadow-lg animate-fade-in">
                    {isModel && (
                        <>
                            <button onClick={() => handleFeedback('like')} className={`p-2 rounded-full transition-colors ${feedback === 'like' ? 'bg-blue-500/50 text-white' : 'hover:bg-white/10 text-gray-300'}`} aria-label="Like response">
                                <ThumbsUpIcon className="w-5 h-5"/>
                            </button>
                            <button onClick={() => handleFeedback('dislike')} className={`p-2 rounded-full transition-colors ${feedback === 'dislike' ? 'bg-red-500/50 text-white' : 'hover:bg-white/10 text-gray-300'}`} aria-label="Dislike response">
                                <ThumbsDownIcon className="w-5 h-5"/>
                            </button>
                            <div className="w-px h-5 bg-white/20 mx-1"></div>
                        </>
                    )}
                    <button onClick={handleCopy} className="p-2 rounded-full hover:bg-white/10 text-gray-300 transition-colors" aria-label="Copy message">
                        {isCopied ? <CheckIcon className="w-5 h-5 text-green-400"/> : <CopyIcon className="w-5 h-5"/>}
                    </button>
                </div>
            )}
            
            <div className="message-content">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                        li: ({node, ...props}) => <li className="pl-2" {...props} />,
                        a: ({node, ...props}) => <a className="text-blue-600 dark:text-cyan-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                        code: ({node, inline, className, children, ...props}) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline ? (
                                <pre className="bg-gray-100 dark:bg-black/20 p-3 rounded-md my-2 overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
                                    <code className={match ? `language-${match[1]}` : ''} {...props}>
                                        {children}
                                    </code>
                                </pre>
                            ) : (
                                <code className="bg-gray-300/50 dark:bg-black/20 text-purple-600 dark:text-purple-300 font-mono text-sm px-1 py-0.5 rounded" {...props}>
                                    {children}
                                </code>
                            );
                        },
                        strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                        em: ({node, ...props}) => <em className="italic" {...props} />,
                    }}
                 >
                    {message.content}
                </ReactMarkdown>
            </div>

            {isModel && (
                <div className="flex items-center justify-start mt-3 gap-3">
                    <button
                        onClick={() => onPlayTTS(message.content, message.id)}
                        className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-wait"
                        aria-label={isTtsPlaying ? 'Stop reading' : 'Read aloud'}
                        disabled={isTtsLoading}
                    >
                        {isTtsLoading ? (
                            <LoadingSpinnerIcon className="w-5 h-5 animate-spin" />
                        ) : isTtsPlaying ? (
                            <StopCircleIcon className="w-5 h-5 text-red-500" />
                        ) : (
                            <VolumeUpIcon className="w-5 h-5"/>
                        )}
                    </button>
                    {message.mode === Mode.THINKING && (
                        <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-300" title="Generated in Deep Thinking mode">
                            <BrainIcon className="w-4 h-4" />
                            <span>Deep Think</span>
                        </div>
                    )}
                </div>
            )}
             {message.sources && message.sources.length > 0 && (
                <div className="mt-4 border-t border-black/10 dark:border-white/10 pt-3">
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Sources</h4>
                    <div className="space-y-2">
                        {message.sources.map((source, index) => (
                            <SourceLink key={index} source={source} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default Message;
