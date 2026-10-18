import React, { useEffect } from 'react';
import { X, Briefcase, Info, ArrowRight } from 'lucide-react';
import { AVAILABLE_POSITIONS } from '../data/positions';

interface AvailableRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AvailableRolesModal: React.FC<AvailableRolesModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-200 flex items-start justify-between bg-stone-50/70">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 tracking-wide uppercase">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Cascade Peak Outfitters</span>
            </div>
            <h2
              id="modal-title"
              className="text-xl sm:text-2xl font-bold text-stone-900 mt-0.5 font-['Plus_Jakarta_Sans'] tracking-tight"
            >
              Available Positions (6)
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Read-only overview of currently open positions across Cascade Peak Outfitters. Role details shown are prototype descriptions provided for application testing.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Guidance Notice */}
        <div className="px-6 py-3 bg-emerald-50/80 border-b border-emerald-100 flex items-start gap-2.5 text-xs text-emerald-950">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Applicant Notice:</span> This reference list is available at any time and does not change your progress or select positions. You can select one or more positions in <strong>Step 3: Select Positions</strong>.
          </div>
        </div>

        {/* Roles List Content (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-4 divide-y divide-stone-100">
          {AVAILABLE_POSITIONS.map((pos, idx) => (
            <div key={pos.id} className={idx > 0 ? 'pt-4' : ''}>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-base font-bold text-stone-900 font-['Plus_Jakarta_Sans']">
                  {idx + 1}. {pos.title}
                </h3>
                <span className="text-[11px] font-medium text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded">
                  {pos.department}
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                {pos.description}
              </p>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <span className="text-xs text-stone-500 hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-stone-300 rounded shadow-2xs">ESC</kbd> or click Close to return.
          </span>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ml-auto"
          >
            <span>Return to Application</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
