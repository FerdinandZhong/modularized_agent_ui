import { create } from 'zustand';
import { ChatMessage } from '@/lib/types';

interface ChatState {
  messages: ChatMessage[];
  userInput: string;

  addMessage: (message: ChatMessage) => void;
  setUserInput: (input: string) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  userInput: '',

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  setUserInput: (input) => {
    set({ userInput: input });
  },

  clearMessages: () => {
    set({ messages: [] });
  },
}));
