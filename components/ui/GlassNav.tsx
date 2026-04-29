import { HTMLAttributes, forwardRef } from 'react';

interface GlassNavProps extends HTMLAttributes<HTMLElement> {}

const GlassNav = forwardRef<HTMLElement, GlassNavProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={`glass-nav sticky top-0 z-50 h-11 flex items-center px-5 ${className}`}
        {...props}
      >
        <div className="mx-auto w-full max-w-[980px]">
          {children}
        </div>
      </nav>
    );
  },
);

GlassNav.displayName = 'GlassNav';

export { GlassNav };
export type { GlassNavProps };
