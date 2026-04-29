'use client';

import { useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { ChatMessage, ChatMessageData } from './ChatMessage';
import { ChatInput, AttachmentState } from './ChatInput';

interface ChatViewProps {
  messages: ChatMessageData[];
  onSend: (message: string, attachment?: AttachmentState) => void;
  isLoading?: boolean;
}

export function ChatView({ messages, onSend, isLoading = false }: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-6 space-y-4"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <MessageSquare size={22} className="text-white/20" />
            </div>
            <p className="text-caption text-white/20">
              Start a conversation
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/50 mt-0.5">
              <div className="h-2.5 w-2.5 rounded-full bg-white/30 animate-pulse" />
            </div>
            <div className="rounded-2xl rounded-tl-md border border-white/[0.06] bg-white/[0.05] px-4 py-3.5">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white/30 animate-[pulse-dot_1.4s_ease-in-out_infinite]" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/30 animate-[pulse-dot_1.4s_ease-in-out_0.2s_infinite]" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/30 animate-[pulse-dot_1.4s_ease-in-out_0.4s_infinite]" />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="shrink-0 px-5 pb-5 pt-2">
        <ChatInput onSend={onSend} disabled={isLoading} />
        <p className="text-center text-[10px] text-white/15 mt-2.5">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
