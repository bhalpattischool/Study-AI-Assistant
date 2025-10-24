
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export enum Mode {
  STANDARD = 'Standard',
  SEARCH = 'Web Search',
  THINKING = 'Deep Thinking',
  LITE = 'Low-Latency',
}

export enum TTSVoice {
    KORE = 'Kore',
    PUCK = 'Puck',
    ZEPHYR = 'Zephyr',
    CHARON = 'Charon',
    FENRIR = 'Fenrir',
}

export interface Settings {
    theme: 'light' | 'dark';
    ttsVoice: TTSVoice;
    showWebSearch: boolean;
    showDeepThinking: boolean;
    userName?: string;
    memory?: Array<{ key: string; value: string; }>;
}

export interface Source {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  sources?: Source[];
  mode?: Mode;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}