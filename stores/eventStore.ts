import { create } from 'zustand';
import { WorkflowEvent } from '@/lib/types';

interface EventState {
  traceId: string | null;
  events: WorkflowEvent[];
  isRunning: boolean;
  crewOutput: string | null;
  error: string | null;

  startExecution: (traceId: string) => void;
  addEvents: (newEvents: WorkflowEvent[]) => void;
  stopExecution: (output?: string, error?: string) => void;
  reset: () => void;
}

export const useEventStore = create<EventState>((set, get) => ({
  traceId: null,
  events: [],
  isRunning: false,
  crewOutput: null,
  error: null,

  startExecution: (traceId) => {
    set({ traceId, events: [], isRunning: true, crewOutput: null, error: null });
  },

  addEvents: (newEvents) => {
    if (newEvents.length === 0) return;
    set((state) => ({
      events: [...state.events, ...newEvents],
    }));
  },

  stopExecution: (output, error) => {
    set({ isRunning: false, crewOutput: output ?? null, error: error ?? null });
  },

  reset: () => {
    set({ traceId: null, events: [], isRunning: false, crewOutput: null, error: null });
  },
}));
