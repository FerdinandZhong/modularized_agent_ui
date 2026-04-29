import { HTMLAttributes, forwardRef } from 'react';

type SectionVariant = 'dark' | 'light';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  variant?: SectionVariant;
  fullWidth?: boolean;
}

const variantStyles: Record<SectionVariant, string> = {
  dark: 'section-dark',
  light: 'section-light',
};

const Section = forwardRef<HTMLElement, SectionProps>(
  ({ variant = 'dark', fullWidth = false, className = '', children, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={`w-full relative ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {fullWidth ? (
          children
        ) : (
          <div className="mx-auto max-w-[980px] px-6">{children}</div>
        )}
      </section>
    );
  },
);

Section.displayName = 'Section';

export { Section };
export type { SectionProps, SectionVariant };
