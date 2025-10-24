import React, { useEffect, useState, useRef } from 'react';
import { ai } from '../services/geminiService';
import { LiveServerMessage, Modality, Blob, LiveSession } from '@google/genai';
import { decode, encode, decodeAudioData } from '../utils/audio';
import { MicIcon, CloseIcon, TranscriptIcon, TranscriptOffIcon } from './icons';
import { Message, Role, Settings } from '../types';

interface HandsFreeModeProps {
  onExit: (messages: Message[]) => void;
  settings: Settings;
}

const HandsFreeMode: React.FC<HandsFreeModeProps> = ({ onExit, settings }) => {
  const [transcription, setTranscription] = useState<{ user: string; model: string; history: string[] }>({
    user: '',
    model: '',
    history: [],
  });
  const [status, setStatus] = useState('Connecting...');
  const [showTranscript, setShowTranscript] = useState(true);

  const outputAudioContextRef = useRef<AudioContext>();
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const messagesRef = useRef<Message[]>([]);
  
  const orbRef = useRef<HTMLDivElement>(null);
  const animationFrameIdRef = useRef<number>();

  useEffect(() => {
    let stream: MediaStream | null = null;
    let inputAudioContext: AudioContext | null = null;
    let scriptProcessor: ScriptProcessorNode | null = null;
    let inputAnalyser: AnalyserNode | null = null;
    let outputAnalyser: AnalyserNode | null = null;

    const setup = async () => {
      try {
        if (!outputAudioContextRef.current) {
          outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          outputAnalyser = outputAudioContextRef.current.createAnalyser();
          outputAnalyser.connect(outputAudioContextRef.current.destination);
        }
        
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        inputAnalyser = inputAudioContext.createAnalyser();
        
        let systemInstruction = `You are a helpful AI assistant named Study AI. You are in a hands-free voice conversation. It's very important that you remember the context of the conversation and build upon previous questions and answers to provide a continuous dialogue. Use your tools to find the latest information when needed.`;
      
        if (settings.userName) {
            systemInstruction = `You are a helpful AI assistant named Study AI. The user's name is ${settings.userName}. Please be friendly and address them by their name where it feels natural. You are in a hands-free voice conversation. It's very important that you remember the context of the conversation and build upon previous questions and answers to provide a continuous, personal dialogue. Use your tools to find the latest information when needed.`;
        }

        if (settings.memory && settings.memory.length > 0) {
            const memoryFacts = settings.memory.filter(mem => mem.key && mem.value).map(mem => `${mem.key}: ${mem.value}`).join('; ');
            if (memoryFacts) {
              systemInstruction += `\n\nAdditionally, remember these key facts about the user: ${memoryFacts}. Use these facts to tailor your responses.`;
            }
        }
        
        sessionPromiseRef.current = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              setStatus('Connected. Speak now.');
              const source = inputAudioContext!.createMediaStreamSource(stream!);
              scriptProcessor = inputAudioContext!.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob: Blob = {
                  data: encode(new Uint8Array(new Int16Array(inputData.map(v => v * 32768)).buffer)),
                  mimeType: 'audio/pcm;rate=16000',
                };
                sessionPromiseRef.current?.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };

              source.connect(inputAnalyser!);
              inputAnalyser!.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (message.serverContent?.outputTranscription) {
                setTranscription(prev => ({ ...prev, model: prev.model + message.serverContent!.outputTranscription!.text }));
              }
              if (message.serverContent?.inputTranscription) {
                setTranscription(prev => ({ ...prev, user: prev.user + message.serverContent!.inputTranscription!.text }));
              }
              if (message.serverContent?.turnComplete) {
                setTranscription(prev => {
                  const userMessageContent = prev.user.trim();
                  const modelMessageContent = prev.model.trim();

                  if (userMessageContent) {
                      messagesRef.current.push({
                          id: `user-${Date.now()}`,
                          role: Role.USER,
                          content: userMessageContent,
                      });
                  }
                  if (modelMessageContent) {
                      messagesRef.current.push({
                          id: `model-${Date.now() + 1}`,
                          role: Role.MODEL,
                          content: modelMessageContent,
                      });
                  }

                  const newHistory = [...prev.history];
                  if (userMessageContent) newHistory.push(`You: ${userMessageContent}`);
                  if (modelMessageContent) newHistory.push(`Study AI: ${modelMessageContent}`);
                  
                  return { user: '', model: '', history: newHistory.slice(-6) };
                });
              }

              if (message.serverContent?.interrupted) {
                  sourcesRef.current.forEach(source => source.stop());
                  sourcesRef.current.clear();
                  nextStartTimeRef.current = 0;
              }

              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio && outputAudioContextRef.current && outputAnalyser) {
                  const ctx = outputAudioContextRef.current;
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                  const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                  const source = ctx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(outputAnalyser);
                  source.addEventListener('ended', () => sourcesRef.current.delete(source));
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                  sourcesRef.current.add(source);
              }
            },
            onerror: (e: ErrorEvent) => setStatus(`Error: ${e.message}`),
            onclose: (e: CloseEvent) => setStatus('Connection closed.'),
          },
          config: {
            responseModalities: [Modality.AUDIO],
            tools: [{ googleSearch: {} }],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
            outputAudioTranscription: {},
            inputAudioTranscription: {},
            systemInstruction: systemInstruction,
          },
        });

      } catch (error) {
        console.error("Failed to start hands-free mode:", error);
        setStatus("Error: Could not access microphone.");
      }
    };
    
    setup();

    const draw = () => {
        animationFrameIdRef.current = requestAnimationFrame(draw);

        const orb = orbRef.current;
        if (!orb) return;
        
        let analyser: AnalyserNode | null = null;
        let isSpeaking = false;

        if (sourcesRef.current.size > 0) {
            analyser = outputAnalyser;
            isSpeaking = true;
            orb.style.background = 'linear-gradient(to bottom right, #A482FF, #7195FF)';
        } else if (inputAnalyser) {
            const data = new Uint8Array(inputAnalyser.frequencyBinCount);
            inputAnalyser.getByteFrequencyData(data);
            if (Math.max(...data) > 40) {
              isSpeaking = true;
              analyser = inputAnalyser;
              orb.style.background = 'linear-gradient(to bottom right, #3B82F6, #2563EB)';
            }
        }

        if (!isSpeaking || !analyser) {
            orb.style.transform = 'scale(1)';
            orb.style.opacity = '0.5';
            return;
        }

        analyser.fftSize = 32;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const avg = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
        const scale = 1 + (avg / 255) * 0.5;
        
        orb.style.transform = `scale(${scale})`;
        orb.style.opacity = `${0.5 + (avg/255) * 0.5}`;
    };

    draw();

    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      sourcesRef.current.forEach(source => source.stop());
      sourcesRef.current.clear();
      scriptProcessor?.disconnect();
      inputAudioContext?.close().catch(console.error);
      stream?.getTracks().forEach(track => track.stop());
      sessionPromiseRef.current?.then(session => session.close()).catch(console.error);
    };
  }, [settings]);

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-xl z-30 flex flex-col items-center justify-center p-4 text-white animate-fade-in">
      <button onClick={() => setShowTranscript(!showTranscript)} className="absolute top-5 left-5 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10" aria-label="Toggle transcript">
        {showTranscript ? <TranscriptIcon className="w-6 h-6" /> : <TranscriptOffIcon className="w-6 h-6" />}
      </button>

      <button onClick={() => onExit(messagesRef.current)} className="absolute top-5 right-5 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors" aria-label="Exit hands-free">
        <CloseIcon className="w-6 h-6" />
      </button>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
        <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
          <div ref={orbRef} className="absolute inset-0 rounded-full transition-all duration-100 ease-out" style={{ transform: 'scale(1)', opacity: 0.5 }}></div>
          <MicIcon className="w-20 h-20 md:w-24 md:h-24 text-white z-10" />
        </div>
        <p className="mt-8 text-lg font-medium text-gray-300 h-8">{status}</p>
      </div>

      <div className={`w-full max-w-3xl absolute bottom-0 h-[40%] transition-opacity duration-300 ${showTranscript ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="h-full bg-black/20 p-4 rounded-t-lg overflow-y-auto font-mono text-lg scroll-smooth flex flex-col-reverse">
            <div className="pt-8">
                {transcription.model && <p className="text-white opacity-70"><span className="font-bold">Study AI:</span> {transcription.model}</p>}
                {transcription.user && <p className="text-blue-300 opacity-70"><span className="font-bold">You:</span> {transcription.user}</p>}
                {transcription.history.slice().reverse().map((line, index) => (
                    <p key={index} className={line.startsWith('You:') ? 'text-blue-300' : 'text-white'}>
                        <span className="font-bold">{line.split(':')[0]}:</span>
                        {line.substring(line.indexOf(':') + 1)}
                    </p>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default HandsFreeMode;