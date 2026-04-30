'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle, Download, Loader2 } from 'lucide-react';

const FILE_PATH_RE = /['"]?((?:\/|\.\/|[A-Za-z]:[\\/])[\w\-. /\\]+\.(?:pdf|csv|xlsx|docx|txt|json|md))['"]?/g;

function extractFilePaths(text: string): string[] {
  const seen = new Set<string>();
  const results: string[] = [];
  let m: RegExpExecArray | null;
  FILE_PATH_RE.lastIndex = 0;
  while ((m = FILE_PATH_RE.exec(text)) !== null) {
    const p = m[1].trim();
    if (!seen.has(p)) { seen.add(p); results.push(p); }
  }
  return results;
}

async function triggerDownload(filePath: string, workflowUrl: string, apiKey: string) {
  const res = await fetch(
    `/api/proxy/api/workflow/files/download?file_path=${encodeURIComponent(filePath)}`,
    { headers: { 'X-Workflow-URL': workflowUrl, 'X-API-Key': apiKey } },
  );
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filePath.split(/[\\/]/).pop() ?? 'download';
  a.click();
  URL.revokeObjectURL(url);
}

function DownloadButton({ filePath, workflowUrl, apiKey }: { filePath: string; workflowUrl: string; apiKey: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      await triggerDownload(filePath, workflowUrl, apiKey);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-caption text-white/60 hover:bg-white/[0.07] hover:text-white/80 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Download size={12} />
        )}
        {filePath.split(/[\\/]/).pop()}
      </button>
      {error && <span className="text-nano text-red-400/70">{error}</span>}
    </div>
  );
}

interface WorkflowOutputProps {
  output: string;
  workflowUrl?: string;
  apiKey?: string;
}

export function WorkflowOutput({ output, workflowUrl, apiKey }: WorkflowOutputProps) {
  const filePaths = workflowUrl && apiKey ? extractFilePaths(output) : [];

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
        {filePaths.length > 0 && (
          <div className="mt-5 flex flex-col gap-2">
            <p className="text-nano text-white/25 uppercase tracking-wider font-medium">Generated files</p>
            {filePaths.map((fp) => (
              <DownloadButton key={fp} filePath={fp} workflowUrl={workflowUrl!} apiKey={apiKey!} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
