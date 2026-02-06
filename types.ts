
export enum Screen {
  LOGIN = 'LOGIN',
  CONSOLE = 'CONSOLE',
  MATCH = 'MATCH',
  COMMUNITY = 'COMMUNITY',
  PROFILE = 'PROFILE',
}

export interface ChatMessage {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: number;
}

export interface ChatSession {
  userId: string;
  username: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: ChatMessage[];
}

export interface BaZiData {
  year: string; month: string; day: string; hour: string;
  yearShen: string; monthShen: string; dayShen: string; hourShen: string;
}

// Added raw input data to support restoring the Console screen
export interface HistoryItem {
  id: string;
  title: string;
  date: string;
  tLevel: string;
  chartData?: BaZiData;
  chatLog?: ChatMessage[];
  // Restore Context
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: number;
  gender?: 'male' | 'female';
  name?: string;
}

export interface UserState {
  id?: string;
  isLoggedIn: boolean;
  phone: string;
  uid: string;
  username: string;
  avatar: string | null;
  balance: number;
  history: HistoryItem[];
  hasAgreedPrivacy: boolean;
  chats: ChatSession[];
  theme: 'dark' | 'light';
}
