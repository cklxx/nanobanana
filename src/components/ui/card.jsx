import * as React from 'react';
import { cn } from '../../lib/utils';

function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-800/70 bg-slate-900/60 shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-md',
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return <div className={cn('flex items-center justify-between gap-3 p-5', className)} {...props} />;
}

function CardContent({ className, ...props }) {
  return <div className={cn('p-5 pt-0', className)} {...props} />;
}

export { Card, CardHeader, CardContent };
