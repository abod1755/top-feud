import { cn } from '@/lib/utils';

/** Loading placeholder with a shimmer sweep. See `.skeleton` in globals.css. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('skeleton', className)} {...props} />;
}

export { Skeleton };
