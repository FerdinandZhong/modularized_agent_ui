import { HTMLAttributes, forwardRef } from 'react';

type CardVariant = 'light' | 'dark' | 'glass';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  elevated?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  light: 'bg-white text-surface-near-black border border-black/[0.04]',
  dark: 'bg-surface-dark-1 text-white border border-white/[0.06]',
  glass: 'bg-white/[0.04] text-white border border-white/[0.08] backdrop-blur-xl',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'light', elevated = false, className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-[16px] p-8 transition-all duration-300 ${variantStyles[variant]} ${elevated ? 'shadow-card hover:shadow-[rgba(0,0,0,0.28)_3px_8px_40px_0px]' : ''} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

export { Card };
export type { CardProps, CardVariant };
