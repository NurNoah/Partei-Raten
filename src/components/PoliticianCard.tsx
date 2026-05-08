/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion } from 'motion/react';
import { ExternalLink, ImageOff, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Politician } from '../lib/wikidata';

interface PoliticianCardProps {
  politician: Politician;
  revealed: boolean;
}

export default function PoliticianCard({ politician, revealed }: PoliticianCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageFailed(false);
    setImageLoaded(false);
  }, [politician.personWikidataId]);

  return (
    <div className="relative w-full max-w-[min(22rem,calc(100vw-2rem))] sm:max-w-sm md:max-w-md mx-auto">
      <motion.div
        className="overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl"
      >
        <div className="aspect-[4/5] sm:aspect-[3/4] relative overflow-hidden bg-zinc-800">
          {imageFailed ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-zinc-900 text-zinc-500">
              <ImageOff className="w-12 h-12" />
              <span className="text-xs uppercase tracking-[0.2em] font-bold">Bild nicht verfügbar</span>
            </div>
          ) : (
            <>
              {!imageLoaded && (
                <div className="loading-shimmer absolute inset-0 z-10 flex items-center justify-center bg-[radial-gradient(circle_at_center,#27272a_0%,#18181b_45%,#09090b_100%)] text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-zinc-700/70 bg-black/25 px-6 py-5 shadow-2xl shadow-black/30 backdrop-blur-sm">
                    <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/60">
                      <span className="absolute inset-0 rounded-full bg-emerald-400/10 animate-ping" />
                      <Loader2 className="relative w-9 h-9 text-emerald-300 animate-spin" />
                    </span>
                    <span className="text-xs uppercase tracking-[0.24em] font-black text-zinc-400 animate-pulse">Bild wird geladen</span>
                  </div>
                </div>
              )}
              <img
                src={politician.imageUrl}
                alt={revealed ? politician.name : 'Unbekannte Person'}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${revealed ? 'scale-105' : 'scale-100 brightness-95 hover:brightness-100'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageFailed(true)}
              />
            </>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/10 to-transparent opacity-80" />

          <AnimatePresence>
            {!revealed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-4 left-4"
              >
                <span className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-zinc-950/80 text-zinc-400 rounded-full border border-zinc-800/50 backdrop-blur-sm">
                  Wer ist das?
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 18 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="absolute inset-x-0 bottom-0 p-4 sm:p-5"
              >
                <div className="flex justify-between items-end gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/85 p-4 backdrop-blur-md">
                  <div className="min-w-0 space-y-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-zinc-50 tracking-tight leading-tight break-words">
                      {politician.name}
                    </h2>
                    <p className="text-zinc-400 text-sm">
                      {politician.partyName}
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                      Bild: Wikimedia Commons / Wikidata
                    </p>
                  </div>
                  <a
                    href={`https://www.wikidata.org/wiki/${politician.personWikidataId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl transition-colors shrink-0"
                    title="Wikidata Info"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
