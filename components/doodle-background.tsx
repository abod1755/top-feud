import { cn } from '@/lib/utils';

/**
 * Subtle tiled "doodle" backdrop (stars, rings, sparkles, question marks…) in
 * the style of arcade/quiz landing pages. Purely decorative and non-interactive.
 */
export function DoodleBackground({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)} aria-hidden>
      <svg className="h-full w-full text-foreground/[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="doodles" width="150" height="150" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
            <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {/* star */}
              <path d="M28 14l4 9 10 1-7.5 6.5 2.5 9.5L28 34l-9 6 2.5-9.5L14 24l10-1z" />
              {/* ring */}
              <circle cx="120" cy="30" r="11" />
              {/* plus */}
              <path d="M60 96v20M50 106h20" />
              {/* triangle */}
              <path d="M118 96l12 20h-24z" />
              {/* small square */}
              <rect x="18" y="98" width="18" height="18" rx="4" />
              {/* dots */}
              <circle cx="92" cy="64" r="2.5" fill="currentColor" stroke="none" />
              <circle cx="40" cy="64" r="2.5" fill="currentColor" stroke="none" />
            </g>
            {/* question mark */}
            <text x="96" y="128" fontSize="26" fill="currentColor" stroke="none" fontWeight="800">؟</text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#doodles)" />
      </svg>
    </div>
  );
}
