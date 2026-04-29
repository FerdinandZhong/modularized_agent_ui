'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[200px] items-center justify-center rounded-large border border-white/[0.08] bg-white/[0.04]">
      <span className="text-caption text-white/25">Loading editor…</span>
    </div>
  ),
});

interface JsonEditorInputProps {
  name: string;
  label: string;
  value: string;
  onChange: (name: string, value: string) => void;
  height?: number;
}

export function JsonEditorInput({ name, label, value, onChange, height = 200 }: JsonEditorInputProps) {
  const [parseError, setParseError] = useState<string | null>(null);

  const handleChange = (raw: string | undefined) => {
    const next = raw ?? '';
    onChange(name, next);
    if (!next.trim()) {
      setParseError(null);
      return;
    }
    try {
      JSON.parse(next);
      setParseError(null);
    } catch (e) {
      setParseError((e as Error).message);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-micro font-medium tracking-wide uppercase text-white/50">
        {label}
      </label>
      <div className="overflow-hidden rounded-large border border-white/[0.08] transition-colors focus-within:border-apple-bright-blue/40">
        <MonacoEditor
          height={height}
          defaultLanguage="json"
          value={value}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'off',
            folding: false,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            renderLineHighlight: 'none',
            padding: { top: 12, bottom: 12 },
            scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
          }}
        />
      </div>
      {parseError && (
        <div className="flex items-start gap-2 text-red-400">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          <span className="text-nano">{parseError}</span>
        </div>
      )}
    </div>
  );
}
