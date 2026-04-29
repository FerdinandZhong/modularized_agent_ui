'use client';

import Link from 'next/link';
import { GlassNav } from '@/components/ui/GlassNav';
import { WorkflowShell } from '@/components/workflow/WorkflowShell';
import { useWorkflowStore } from '@/stores/workflowStore';

export default function WorkflowPage() {
  const { workflowData, isConnected } = useWorkflowStore();
  const workflowName = workflowData?.workflow.name ?? 'Agent Workflow';

  return (
    <div className="flex h-screen flex-col bg-black">
      <GlassNav>
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-micro font-medium tracking-wider uppercase text-white/80">
              {workflowName}
            </span>
            <span className="text-nano text-white/20">|</span>
            <span className="flex items-center gap-1.5 text-micro text-white/40">
              <span className="relative flex h-1.5 w-1.5">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'animate-ping bg-emerald-400' : 'bg-white/20'}`} />
                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-white/20'}`} />
              </span>
              {isConnected ? 'Connected' : 'Demo Mode'}
            </span>
          </div>
          <Link
            href="/"
            className="text-micro text-white/40 no-underline hover:text-white/70 transition-colors"
          >
            {isConnected ? 'Disconnect' : '← Back'}
          </Link>
        </div>
      </GlassNav>

      <WorkflowShell />
    </div>
  );
}
