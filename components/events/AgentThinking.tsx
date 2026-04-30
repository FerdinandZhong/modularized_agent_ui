'use client';

import { useRef, useEffect } from 'react';
import { Brain } from 'lucide-react';
import { WorkflowEvent } from '@/lib/types';

// ── Response parser ────────────────────────────────────────────────────────────

interface ParsedResponse {
  thought?: string;
  action?: string;
  actionInput?: string;
  finalAnswer?: string;
}

function parseResponse(text: string): ParsedResponse {
  const result: ParsedResponse = {};

  const thoughtMatch = text.match(/Thought:\s*([\s\S]*?)(?=\nAction:|\nFinal Answer:|$)/);
  if (thoughtMatch) result.thought = thoughtMatch[1].trim();

  const actionMatch = text.match(/Action:\s*([^\n]+)/);
  if (actionMatch) result.action = actionMatch[1].trim();

  const actionInputMatch = text.match(/Action Input:\s*([\s\S]+?)(?=\nObservation:|$)/);
  if (actionInputMatch) {
    const raw = actionInputMatch[1].trim();
    try {
      result.actionInput = JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      result.actionInput = raw;
    }
  }

  const finalMatch = text.match(/Final Answer:\s*([\s\S]+)/);
  if (finalMatch) result.finalAnswer = finalMatch[1].trim();

  return result;
}

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '';
  }
}

// ── Single thinking bubble ────────────────────────────────────────────────────

function ThinkingBubble({ event, index }: { event: WorkflowEvent; index: number }) {
  const response = event.response;
  if (!response) return null;

  const parsed = parseResponse(response);
  const hasStructure = parsed.thought || parsed.action || parsed.finalAnswer;

  return (
    <div className="flex flex-col gap-1.5 pb-4 animate-fade-in" style={{ animationDelay: `${index * 40}ms` }}>
      {hasStructure ? (
        <>
          {parsed.thought && (
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] px-3 py-2.5">
              <p className="text-nano text-white/25 mb-1 uppercase tracking-wider font-medium">Thought</p>
              <p className="text-caption text-white/45 italic leading-relaxed">{parsed.thought}</p>
            </div>
          )}
          {parsed.action && (
            <div className="rounded-xl bg-apple-blue/[0.08] border border-apple-blue/[0.15] px-3 py-2.5">
              <p className="text-nano text-apple-blue/50 mb-1 uppercase tracking-wider font-medium">Action</p>
              <p className="text-caption text-apple-bright-blue font-medium">{parsed.action}</p>
              {parsed.actionInput && (
                <pre className="mt-2 text-nano text-white/30 whitespace-pre-wrap break-words font-mono leading-relaxed max-h-28 overflow-y-auto">
                  {parsed.actionInput}
                </pre>
              )}
            </div>
          )}
          {parsed.finalAnswer && (
            <div className="rounded-xl bg-emerald-500/[0.06] border border-emerald-500/[0.15] px-3 py-2.5">
              <p className="text-nano text-emerald-400/50 mb-1 uppercase tracking-wider font-medium">Final Answer</p>
              <p className="text-caption text-white/65 leading-relaxed whitespace-pre-wrap line-clamp-5">
                {parsed.finalAnswer}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] px-3 py-2.5">
          <p className="text-caption text-white/40 leading-relaxed whitespace-pre-wrap line-clamp-4">{response}</p>
        </div>
      )}
      <p className="text-nano text-white/15 px-1">{formatTime(event.timestamp)}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface AgentThinkingProps {
  events: WorkflowEvent[];
  isRunning: boolean;
}

export function AgentThinking({ events, isRunning }: AgentThinkingProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const thinkingEvents = events.filter(e => e.type === 'llm_call_completed' && e.response);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thinkingEvents.length]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <Brain size={13} className={isRunning ? 'text-apple-bright-blue animate-pulse' : 'text-white/30'} />
          <span className="text-micro font-medium tracking-wider uppercase text-white/40">Agent Thinking</span>
        </div>
        {thinkingEvents.length > 0 && (
          <span className="text-nano text-white/20">{thinkingEvents.length}</span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
        {thinkingEvents.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <Brain size={18} className="text-white/10 animate-pulse" />
            <p className="text-nano text-white/20">Waiting for agent responses…</p>
          </div>
        ) : (
          <>
            {thinkingEvents.map((event, i) => (
              <ThinkingBubble key={`${event.timestamp}-${i}`} event={event} index={i} />
            ))}
            {isRunning && (
              <div className="flex items-center gap-2 pb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-apple-bright-blue/60 animate-pulse" />
                <span className="text-nano text-white/25 italic">Agent is processing…</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
