'use client';

import { useRef } from 'react';

interface TextAreaInputProps {
  name: string;
  label: string;
  value: string;
  onChange: (name: string, value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function TextAreaInput({ name, label, value, onChange, placeholder, rows = 5 }: TextAreaInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleInput = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, rows * 24)}px`;
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-micro font-medium tracking-wide uppercase text-white/50">
        {label}
      </label>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        onInput={handleInput}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}…`}
        rows={rows}
        className="w-full resize-none rounded-large border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-body text-white placeholder:text-white/25 outline-none transition-all duration-300 focus:border-apple-bright-blue/40 focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(41,151,255,0.1)]"
      />
    </div>
  );
}
