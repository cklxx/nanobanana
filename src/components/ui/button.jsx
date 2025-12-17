import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-indigo-400 via-indigo-300 to-emerald-300 text-slate-950 shadow-lg shadow-indigo-500/20 hover:translate-y-[-2px] hover:shadow-indigo-500/30',
        secondary: 'bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700/80',
        ghost: 'bg-slate-900/40 border border-slate-800 text-slate-100 hover:bg-slate-800/80',
        outline:
          'border border-slate-800 bg-slate-900/40 text-slate-100 hover:bg-slate-800/60 focus-visible:ring-offset-0'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-6',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
