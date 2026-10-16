import React from 'react';
import { Mountain, Compass } from 'lucide-react';

interface HeaderProps {
  onShowBusinessGoals: () => void;
  showGoalsBanner: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onShowBusinessGoals, showGoalsBanner }) => {
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
                Recruitment Prototype
              </span>
            </div>
          </div>

          {/* Zone 2: clean single-line nav links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-stone-300">
            <a
              href="#about-portal"
              onClick={(e) => {
                e.preventDefault();
                alert('Cascade Peak Outfitters Prototype: Tests automated CV extraction and structured applicant intake to address manual processing times and incomplete applications.');
              }}
              className="hover:text-emerald-300 transition-colors whitespace-nowrap"
            >
              Prototype Overview
            </a>
            <a
              href="#openings"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('positions-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-emerald-300 transition-colors whitespace-nowrap"
            >
              Available Roles (6)
            </a>
            <span className="text-stone-600">|</span>
            <span className="text-stone-400 font-mono text-[11px] whitespace-nowrap">
              Intake Volume: ~4,800/yr
            </span>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onShowBusinessGoals}
              className={`px-3.5 py-1.5 text-xs font-medium rounded transition-all whitespace-nowrap flex items-center gap-1.5 border cursor-pointer ${
                showGoalsBanner
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600/70'
                  : 'bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>{showGoalsBanner ? 'Hide Baseline Data' : 'Current Baselines'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
