import React from 'react';
import { Mountain } from 'lucide-react';

interface HeaderProps {
  onOpenOverviewModal: () => void;
  onOpenRolesModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenOverviewModal,
  onOpenRolesModal,
}) => {
  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-40 backdrop-blur-md bg-stone-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Zone 1: Single text element wordmark with icon */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded bg-emerald-800 flex items-center justify-center text-emerald-200 border border-emerald-700/60 shadow-inner">
              <Mountain className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white font-['Plus_Jakarta_Sans'] whitespace-nowrap">
                Cascade Peak Outfitters
              </span>
              <span className="text-[11px] text-stone-400 font-mono tracking-wide">
                Recruitment Intake Prototype
              </span>
            </div>
          </div>

          {/* Zone 2: clean single-line nav links */}
          <nav className="flex items-center gap-4 sm:gap-7 text-xs font-medium text-stone-300">
            <button
              type="button"
              onClick={onOpenOverviewModal}
              className="hover:text-emerald-300 text-stone-300 font-medium transition-colors whitespace-nowrap cursor-pointer text-xs"
            >
              Prototype Overview
            </button>
            <button
              type="button"
              onClick={onOpenRolesModal}
              className="hover:text-emerald-300 text-stone-300 font-medium transition-colors whitespace-nowrap cursor-pointer text-xs"
            >
              Available Roles (6)
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
