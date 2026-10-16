import React from 'react';
import { Clock, TrendingDown, AlertCircle, Mail, DollarSign, UserX } from 'lucide-react';

interface BusinessImpactBannerProps {
  onDismiss?: () => void;
}

export const BusinessImpactBanner: React.FC<BusinessImpactBannerProps> = () => {
  return (
    <div className="bg-stone-900 border-b border-stone-800 text-stone-200 py-3.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <span>Cascade Peak Outfitters Recruitment Intake Prototype</span>
              <span className="text-emerald-400 font-mono text-[11px] font-normal">
                · Current Operational Baselines (~4,800 Applications/Year)
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5 max-w-3xl leading-relaxed">
              Designed to test automated resume extraction and structured data entry. Potential business value targets reductions in manual recruiter processing, incomplete submissions, and applicant drop-off.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-left shrink-0">
            <div className="bg-stone-800/80 rounded px-2.5 py-1.5 border border-stone-700/60">
              <div className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>HR Processing</span>
              </div>
              <div className="text-xs font-bold text-white font-mono mt-0.5">
                14 min / app
              </div>
            </div>

            <div className="bg-stone-800/80 rounded px-2.5 py-1.5 border border-stone-700/60">
              <div className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span>Incomplete</span>
              </div>
              <div className="text-xs font-bold text-white font-mono mt-0.5">
                28% baseline
              </div>
            </div>

            <div className="bg-stone-800/80 rounded px-2.5 py-1.5 border border-stone-700/60">
              <div className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                <Mail className="w-3 h-3 text-amber-400" />
                <span>Follow-ups</span>
              </div>
              <div className="text-xs font-bold text-white font-mono mt-0.5">
                1,100 / yr
              </div>
            </div>

            <div className="bg-stone-800/80 rounded px-2.5 py-1.5 border border-stone-700/60">
              <div className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-400" />
                <span>Recruiter Labor</span>
              </div>
              <div className="text-xs font-bold text-white font-mono mt-0.5">
                $82,000 / yr
              </div>
            </div>

            <div className="bg-stone-800/80 rounded px-2.5 py-1.5 border border-stone-700/60">
              <div className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>Completion</span>
              </div>
              <div className="text-xs font-bold text-white font-mono mt-0.5">
                24 min baseline
              </div>
            </div>

            <div className="bg-stone-800/80 rounded px-2.5 py-1.5 border border-stone-700/60">
              <div className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                <UserX className="w-3 h-3 text-amber-400" />
                <span>Drop-off</span>
              </div>
              <div className="text-xs font-bold text-white font-mono mt-0.5">
                22% baseline
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
