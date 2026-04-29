'use client';

import { useRef, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';
import { WorkflowEvent } from '@/lib/types';
import { EventCard } from './EventCard';

interface EventTimelineProps {
  events: WorkflowEvent[];
  isRunning: boolean;
}

export function EventTimeline({ events, isRunning }: EventTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <Activity size={13} className={isRunning ? 'text-apple-bright-blue animate-pulse' : 'text-white/30'} />
          <span className="text-micro font-medium tracking-wider uppercase text-white/40">
            Event Timeline
          </span>
        </div>
        {events.length > 0 && (
          <span className="text-nano text-white/20">{events.length} events</span>
        )}
      </div>

      {/* Events */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
        {events.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Clock size={20} className="text-white/15" />
            </div>
            <p className="text-caption text-white/15 text-center">
              {isRunning ? 'Waiting for events…' : 'Events will stream here during execution'}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[11px] top-0 bottom-0 w-px bg-white/[0.06]" />
            {events.map((event, i) => (
              <EventCard key={`${event.type}-${i}`} event={event} index={i} />
            ))}
            {isRunning && (
              <div className="flex items-center gap-3 pl-0.5">
                <div className="flex h-6 w-6 items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-apple-blue animate-pulse" />
                </div>
                <span className="text-caption text-white/25 italic">Processing…</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
