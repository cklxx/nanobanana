import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-sky-300 bg-sky-100 text-slate-700',
        success: 'border-emerald-300 bg-emerald-100 text-emerald-800',
        muted: 'border-slate-200 bg-white/85 text-slate-600',
        info: 'border-indigo-200 bg-indigo-50 text-indigo-700',
        destructive: 'border-rose-200 bg-rose-50 text-rose-700'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
