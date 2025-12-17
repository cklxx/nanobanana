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
          'bg-gradient-to-r from-sky-200 via-cyan-100 to-amber-100 text-slate-900 shadow-lg shadow-sky-100/60 hover:translate-y-[-2px] hover:shadow-sky-100/80',
        secondary: 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50',
        ghost: 'bg-white/70 border border-slate-200 text-slate-700 hover:bg-slate-100',
        outline:
          'border border-slate-300 bg-white/60 text-slate-800 hover:bg-slate-50 focus-visible:ring-offset-0'
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
