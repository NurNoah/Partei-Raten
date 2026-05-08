/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';

interface AnswerOptionsProps {
  options: string[];
  correctAnswer: string;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
}

export default function AnswerOptions({ options, correctAnswer, selectedAnswer, onSelect }: AnswerOptionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-2xl">
      {options.map((option, index) => {
        const isSelected = selectedAnswer === option;
        const isCorrect = option === correctAnswer;
        const showResult = selectedAnswer !== null;

        let bgColor = "bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800";
        if (showResult) {
          if (isCorrect) bgColor = "bg-emerald-900/40 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)] text-emerald-400";
          else if (isSelected) bgColor = "bg-red-900/40 border-red-500 text-red-400";
          else bgColor = "bg-zinc-900/50 border-zinc-800 opacity-40";
        }

        return (
          <motion.button
            key={option}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            disabled={showResult}
            onClick={() => onSelect(option)}
            className={`
              relative flex min-h-14 sm:min-h-16 items-center justify-between px-3 py-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-colors duration-300
              font-bold text-left group disabled:cursor-default ${bgColor}
            `}
          >
            <span className="min-w-0 pr-2 text-sm sm:text-base leading-tight break-words">{option}</span>
            
            {showResult && isCorrect && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="shrink-0 bg-emerald-500 text-emerald-950 rounded-full p-1">
                <Check className="w-3 h-3" />
              </motion.div>
            )}
            
            {showResult && isSelected && !isCorrect && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="shrink-0 bg-red-500 text-red-950 rounded-full p-1">
                <X className="w-3 h-3" />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
