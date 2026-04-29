import { InputHTMLAttributes, forwardRef } from 'react';

type InputVariant = 'light' | 'dark';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  variant?: InputVariant;
}

const variantStyles: Record<InputVariant, string> = {
  light: [
    'border-black/[0.08] bg-white text-surface-near-black',
    'placeholder:text-black/30',
    'focus:border-apple-blue/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,113,227,0.1)]',
  ].join(' '),
  dark: [
    'border-white/[0.08] bg-white/[0.06] text-white',
    'placeholder:text-white/30',
    'focus:border-apple-bright-blue/40 focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(41,151,255,0.1)]',
  ].join(' '),
};

const labelStyles: Record<InputVariant, string> = {
  light: 'text-surface-near-black/70',
  dark: 'text-white/50',
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, variant = 'light', className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className={`text-micro font-medium tracking-wide uppercase ${labelStyles[variant]}`}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-large border px-4 py-3 text-body outline-none transition-all duration-300 ${variantStyles[variant]} ${className}`}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
export type { InputProps, InputVariant };
