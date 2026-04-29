'use client';

import { EventCategory } from '@/lib/constants';

interface EventBadgeProps {
  category: EventCategory;
}

const STYLES: Record<EventCategory, string> = {
  task:     'bg-blue-500/15 text-blue-300 border-blue-500/20',
  agent:    'bg-violet-500/15 text-violet-300 border-violet-500/20',
  tool:     'bg-amber-500/15 text-amber-300 border-amber-500/20',
  llm:      'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
  terminal: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
};

const LABELS: Record<EventCategory, string> = {
  task:     'Task',
  agent:    'Agent',
  tool:     'Tool',
  llm:      'LLM',
  terminal: 'Done',
};

export function EventBadge({ category }: EventBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide ${STYLES[category]}`}
    >
      {LABELS[category]}
    </span>
  );
}
