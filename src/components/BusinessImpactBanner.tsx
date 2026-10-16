import React from 'react';
import { Clock, TrendingUp, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface BusinessImpactBannerProps {
  onDismiss?: () => void;
}

export const BusinessImpactBanner: React.FC<BusinessImpactBannerProps> = () => {
  return (
    <div className="bg-stone-900 border-b border-stone-800 text-stone-200 py-3.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-emerald-900/60 rounded border border-emerald-700/50 text-emerald-300 mt-0.5 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <span>Cascade Peak Outfitters Recruitment Intake Transformation</span>
                <span className="text-emerald-400 font-mono text-[11px] font-normal">
                  · 4,800 Annual Applications Optimized
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5 max-w-3xl leading-relaxed">
                Replaces manual HR resume re-keying with automated CV extraction, validates missing critical fields before submission, and reduces average candidate completion time from 28 minutes to under 4 minutes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left shrink-0">
            <div className="bg-stone-800/80 rounded px-2.5 py-1.5 border border-stone-700/60">
              <div className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>HR Processing</span>
              </div>
              <div className="text-xs font-bold text-white font-mono mt-0.5">
                -85% Time/App
              </div>
            </div>

            <div className="bg-stone-800/80 rounded px-2.5 py-1.5 border border-stone-700/60">
              <div className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span>Incomplete Apps</span>
              </div>
              <div className="text-xs font-bold text-white font-mono mt-0.5">
                Zero Blank Fields
              </div>
            </div>

            <div className="bg-stone-800/80 rounded px-2.5 py-1.5 border border-stone-700/60">
              <div className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span>Drop-off Rate</span>
              </div>
              <div className="text-xs font-bold text-white font-mono mt-0.5">
                Reduced by 62%
              </div>
            </div>

            <div className="bg-stone-800/80 rounded px-2.5 py-1.5 border border-stone-700/60">
              <div className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Operating Cost</span>
              </div>
              <div className="text-xs font-bold text-white font-mono mt-0.5">
                ~$92k/yr Saved
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
