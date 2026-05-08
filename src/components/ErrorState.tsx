/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 p-8 text-center border border-zinc-800 rounded-3xl bg-zinc-900/50">
      <AlertCircle className="w-16 h-16 text-red-500" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-zinc-100">Hoppla! Da lief was schief.</h2>
        <p className="text-zinc-400 max-w-xs">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-900 font-semibold rounded-full hover:bg-white transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Nochmal versuchen
      </button>
    </div>
  );
}
