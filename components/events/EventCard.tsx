'use client';

import {
  ListChecks, Bot, Wrench, Brain,
  CheckCircle, XCircle, AlertCircle,
} from 'lucide-react';
import { WorkflowEvent } from '@/lib/types';
import { EventCategory, EVENT_LABELS, EVENT_CATEGORIES } from '@/lib/constants';
import { EventBadge } from './EventBadge';

interface EventCardProps {
  event: WorkflowEvent;
  index: number;
}

const CATEGORY_ICONS: Record<EventCategory, React.ReactNode> = {
  task:     <ListChecks size={14} />,
  agent:    <Bot size={14} />,
  tool:     <Wrench size={14} />,
  llm:      <Brain size={14} />,
  terminal: <CheckCircle size={14} />,
};

const CATEGORY_ICON_STYLES: Record<EventCategory, string> = {
  task:     'bg-blue-500/10 text-blue-400',
  agent:    'bg-violet-500/10 text-violet-400',
  tool:     'bg-amber-500/10 text-amber-400',
  llm:      'bg-cyan-500/10 text-cyan-400',
  terminal: 'bg-emerald-500/10 text-emerald-400',
};

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '';
  }
}

function getDetail(event: WorkflowEvent): string | null {
  if (event.agent_name) return event.agent_name;
  if (event.tool_name) return event.tool_name;
  if (event.task_name) return event.task_name;
  if (event.model) return event.model;
  if (event.error) return event.error;
  return null;
}

export function EventCard({ event, index }: EventCardProps) {
  const category = EVENT_CATEGORIES[event.type] ?? 'terminal';
  const label = EVENT_LABELS[event.type] ?? event.type;
  const detail = getDetail(event);
  const isFailed = event.type.endsWith('_error') || event.type.endsWith('_failed');

  const icon = isFailed
    ? <XCircle size={14} />
    : event.type === 'crew_kickoff_failed'
    ? <AlertCircle size={14} />
    : CATEGORY_ICONS[category];

  const iconStyle = isFailed
    ? 'bg-red-500/10 text-red-400'
    : CATEGORY_ICON_STYLES[category];

  return (
    <div
      className="flex items-start gap-3 animate-fade-in"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${iconStyle}`}>
          {icon}
        </div>
      </div>

      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-caption text-white/80">{label}</span>
          <EventBadge category={isFailed ? 'terminal' : category} />
        </div>
        {detail && (
          <p className="text-nano text-white/35 mt-0.5 truncate">{detail}</p>
        )}
        <p className="text-nano text-white/20 mt-0.5">
          {formatTime(event.timestamp)}
        </p>
      </div>
    </div>
  );
}
