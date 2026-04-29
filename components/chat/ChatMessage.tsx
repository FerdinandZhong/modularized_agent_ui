'use client';

import { Bot, User, Paperclip } from 'lucide-react';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  attachmentName?: string;
  attachmentPath?: string;
}

interface ChatMessageProps {
  message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5 ${
          isUser
            ? 'bg-apple-blue/15 text-apple-blue'
            : 'bg-white/[0.06] text-white/50'
        }`}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div className={`max-w-[78%] flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Attachment chip */}
        {message.attachmentName && (
          <div className={`flex items-center gap-1.5 rounded-large px-3 py-1.5 border ${
            isUser
              ? 'bg-apple-blue/10 border-apple-blue/20 text-apple-blue'
              : 'bg-white/[0.04] border-white/[0.08] text-white/50'
          }`}>
            <Paperclip size={11} />
            <span className="text-nano truncate max-w-[180px]">{message.attachmentName}</span>
          </div>
        )}
        {/* Message bubble */}
        {message.content && (
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? 'bg-apple-blue text-white rounded-tr-md'
                : 'bg-white/[0.05] text-white/90 border border-white/[0.06] rounded-tl-md'
            }`}
          >
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        )}
        {message.timestamp && (
          <p className={`text-[10px] px-1 ${isUser ? 'text-right text-white/25' : 'text-white/20'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}
