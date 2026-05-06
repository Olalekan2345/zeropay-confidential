import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border',
  {
    variants: {
      variant: {
        default: 'bg-brand-50 text-brand-700 border-brand-200',
        secondary: 'bg-slate-100 text-slate-700 border-slate-200',
        destructive: 'bg-red-50 text-red-700 border-red-200',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        outline: 'border-slate-200 text-slate-600 bg-white',
        purple: 'bg-violet-50 text-violet-700 border-violet-200',
        glass: 'bg-white/70 backdrop-blur text-slate-700 border-white/50',
        confidential: 'bg-slate-900 text-slate-100 border-slate-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
