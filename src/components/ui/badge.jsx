import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-indigo-500/40 bg-indigo-500/15 text-indigo-100',
        success: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-100',
        muted: 'border-slate-700 bg-slate-800 text-slate-200',
        info: 'border-blue-500/50 bg-blue-500/15 text-blue-100',
        destructive: 'border-red-500/50 bg-red-500/15 text-red-100'
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
