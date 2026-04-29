'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle } from 'lucide-react';

interface WorkflowOutputProps {
  output: string;
}

export function WorkflowOutput({ output }: WorkflowOutputProps) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="border-b border-white/[0.06] px-5 py-3 shrink-0 flex items-center gap-2">
        <CheckCircle size={13} className="text-emerald-400" />
        <span className="text-micro font-medium tracking-wider uppercase text-white/40">
          Result
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="prose prose-invert prose-sm max-w-none
          prose-p:text-white/70 prose-p:leading-relaxed
          prose-headings:text-white prose-headings:font-semibold
          prose-strong:text-white
          prose-code:text-apple-bright-blue prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px]
          prose-pre:bg-white/[0.04] prose-pre:border prose-pre:border-white/[0.08] prose-pre:rounded-large
          prose-ul:text-white/70 prose-ol:text-white/70
          prose-li:marker:text-white/30
          prose-hr:border-white/[0.08]
          prose-blockquote:border-apple-blue/40 prose-blockquote:text-white/50
          prose-a:text-apple-bright-blue prose-a:no-underline hover:prose-a:underline
          prose-table:text-white/70
          prose-th:text-white/50 prose-th:border-white/[0.08]
          prose-td:border-white/[0.06]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {output}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
