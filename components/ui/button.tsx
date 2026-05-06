import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2',
  {
    variants: {
      variant: {
        default: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-md active:scale-[0.98]',
        destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
        outline: 'border border-surface-200 bg-white hover:bg-surface-50 text-slate-700 shadow-sm hover:border-brand-300',
        secondary: 'bg-surface-100 text-slate-700 hover:bg-surface-200',
        ghost: 'hover:bg-surface-100 text-slate-600 hover:text-slate-900',
        link: 'text-brand-600 underline-offset-4 hover:underline',
        success: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm',
        warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm',
        glass: 'glass-card text-slate-700 hover:bg-white/90 border border-white/60',
        gradient: 'bg-gradient-to-r from-brand-600 to-violet-600 text-white hover:from-brand-700 hover:to-violet-700 shadow-md hover:shadow-lg active:scale-[0.98]',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-lg px-6 text-base',
        xl: 'h-12 rounded-lg px-8 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
