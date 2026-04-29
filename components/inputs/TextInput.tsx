'use client';

interface TextInputProps {
  name: string;
  label: string;
  value: string;
  onChange: (name: string, value: string) => void;
  placeholder?: string;
}

export function TextInput({ name, label, value, onChange, placeholder }: TextInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-micro font-medium tracking-wide uppercase text-white/50">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}…`}
        className="w-full rounded-large border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-body text-white placeholder:text-white/25 outline-none transition-all duration-300 focus:border-apple-bright-blue/40 focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(41,151,255,0.1)]"
      />
    </div>
  );
}
