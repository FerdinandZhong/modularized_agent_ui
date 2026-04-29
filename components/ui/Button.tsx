import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'dark' | 'pill' | 'pill-dark';
type ButtonSize = 'default' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-apple-blue text-white border border-transparent rounded-pill',
    'hover:bg-[#0077ed] active:scale-[0.97]',
    'shadow-[0_0_0_0_rgba(0,113,227,0)] hover:shadow-[0_4px_16px_rgba(0,113,227,0.3)]',
  ].join(' '),
  dark: [
    'bg-surface-near-black text-white border border-transparent rounded-pill',
    'hover:bg-[#2d2d2f] active:scale-[0.97]',
  ].join(' '),
  pill: [
    'bg-transparent text-apple-link-blue border border-apple-link-blue/40 rounded-pill',
    'hover:border-apple-link-blue hover:bg-apple-link-blue/5 active:scale-[0.97]',
  ].join(' '),
  'pill-dark': [
    'bg-transparent text-apple-bright-blue border border-apple-bright-blue/30 rounded-pill',
    'hover:border-apple-bright-blue/70 hover:bg-apple-bright-blue/5 active:scale-[0.97]',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  default: 'px-6 py-[10px] text-link',
  lg: 'px-8 py-3 text-body',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'default', className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center font-sans transition-all duration-300 ease-out focus-ring cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
