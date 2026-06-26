'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { BRAND } from '@/lib/brand';

const STORAGE_KEY = 'lamma_splash_seen';

/**
 * Full-screen entry splash (big sticker wordmark + a "جاهز!" button), inspired
 * by 10top.gg. Shown on the first visit of a browser session; clicking the
 * button fades it away to reveal the landing page. Remembered via sessionStorage
 * so it doesn't re-appear on in-session navigation.
 */
export function SplashGate() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) setOpen(false);
    } catch {
      // sessionStorage unavailable — just show the splash this once.
    }
  }, []);

  function enter() {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45 } }}
          className="fixed inset-0 z-[100] grid place-items-center bg-background"
        >
          <div className="flex flex-col items-center gap-10 px-6 text-center">
            <motion.h1
              initial={{ scale: 0.8, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 16 }}
              className="text-sticker font-display text-7xl font-extrabold leading-none md:text-8xl"
            >
              {BRAND.name}
            </motion.h1>

            <motion.button
              type="button"
              onClick={enter}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              whileTap={{ y: 2 }}
              className="btn-chunky px-12 py-4 text-2xl"
              style={{ backgroundColor: 'hsl(176 76% 49%)' }}
              autoFocus
            >
              جاهز!
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
