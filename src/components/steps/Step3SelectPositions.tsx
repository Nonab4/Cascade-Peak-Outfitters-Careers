import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Check,
  CheckCircle2,
  MapPin,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Search,
  Sparkles,
} from 'lucide-react';
import { JobPosition, ApplicantData } from '../../types/application';
import { AVAILABLE_POSITIONS } from '../../data/positions';
import { getPositionRecommendations } from '../../utils/positionRecommender';

interface Step3SelectPositionsProps {
  applicantData: ApplicantData;
  selectedPositions: JobPosition[];
  onTogglePosition: (pos: JobPosition) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step3SelectPositions: React.FC<Step3SelectPositionsProps> = ({
  applicantData,
  selectedPositions,
  onTogglePosition,
  onNext,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPositionId, setExpandedPositionId] = useState<string | null>(null);

  // Compute lightweight recommendations based on applicant's existing structured data
  const recommendations = useMemo(() => {
    return getPositionRecommendations(applicantData, AVAILABLE_POSITIONS);
  }, [applicantData]);

  const filteredPositions = AVAILABLE_POSITIONS.filter((pos) => {
    return (
      pos.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pos.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pos.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const isSelected = (posId: string) => selectedPositions.some((p) => p.id === posId);

  return (
    <div className="space-y-8" id="positions-section">
      {/* Step Header */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 tracking-wide uppercase">
              <span>Step 3 of 5</span>
              <span aria-hidden="true">·</span>
              <span>Position Selection</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1 font-['Plus_Jakarta_Sans'] tracking-tight">
              Select Positions of Interest
            </h2>
            <p className="text-stone-600 text-sm mt-1 max-w-2xl">
              Applicants may apply for one or more available roles at Cascade Peak Outfitters. Select all positions matching your background and career goals.
            </p>
            <p className="text-stone-400 text-[11px] mt-1 italic">
              Role details shown are prototype descriptions provided for application testing.
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-center shrink-0">
            <span className="text-[11px] text-emerald-800 font-medium block">Selected Roles</span>
            <span className="text-lg font-bold text-emerald-900 font-mono">
              {selectedPositions.length} of {AVAILABLE_POSITIONS.length}
            </span>
          </div>
        </div>

        {/* Search & Role View Toolbar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-stone-100">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search positions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 focus:border-emerald-700 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className={`px-3 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                searchTerm === ''
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Roles ({AVAILABLE_POSITIONS.length})
            </button>
          </div>
        </div>
      </div>

      {/* POSITIONS LIST */}
      <div className="space-y-6">
        {filteredPositions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-stone-200">
            <p className="text-sm font-medium text-stone-700">No positions match your search &ldquo;{searchTerm}&rdquo;.</p>
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="mt-3 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 cursor-pointer"
            >
              Show All Roles ({AVAILABLE_POSITIONS.length})
            </button>
          </div>
        ) : (
          (() => {
            const hasAnyRecommendations = recommendations.size > 0;
            const recommendedPositions = filteredPositions.filter((pos) => recommendations.has(pos.id));
            const otherPositions = filteredPositions.filter((pos) => !recommendations.has(pos.id));

            const renderPositionCard = (position: JobPosition) => {
              const selected = isSelected(position.id);
              const isExpanded = expandedPositionId === position.id;
              const rec = recommendations.get(position.id);

              return (
                <div
                  key={position.id}
                  className={`rounded-xl border transition-all duration-200 bg-white ${
                    selected
                      ? 'border-emerald-800 ring-2 ring-emerald-700/20 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 shadow-2xs'
                  }`}
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Checkbox & Role Summary */}
                      <div className="flex items-start gap-4">
                        <button
                          type="button"
                          onClick={() => onTogglePosition(position)}
                          className={`mt-1 w-6 h-6 rounded flex items-center justify-center border transition-all ${
                            selected
                              ? 'bg-emerald-800 border-emerald-800 text-white'
                              : 'border-stone-300 bg-white hover:border-stone-400'
                          }`}
                        >
                          {selected && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-stone-900 font-['Plus_Jakarta_Sans']">
                              {position.title}
                            </h3>
                            <span className="text-[11px] text-stone-500 font-medium bg-stone-100 px-2 py-0.5 rounded">
                              {position.workType}
                            </span>
                            {rec && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                <span>Recommended based on your background</span>
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-stone-500 font-medium mt-0.5">
                            {position.department}
                          </p>

                          <div className="flex items-center gap-2 text-xs text-stone-600 mt-2">
                            <MapPin className="w-3.5 h-3.5 text-stone-400" />
                            <span>{position.location}</span>
                          </div>

                          <p className="text-xs text-stone-600 mt-2 leading-relaxed max-w-3xl">
                            {position.description}
                          </p>

                          {rec && (
                            <div className="mt-2.5 p-2.5 bg-emerald-50/60 border border-emerald-200/70 rounded-lg text-xs text-emerald-950 flex items-start gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                              <p className="leading-relaxed">
                                {rec.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions Right */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-stone-100">
                        <button
                          type="button"
                          onClick={() => onTogglePosition(position)}
                          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                            selected
                              ? 'bg-emerald-800 text-white hover:bg-emerald-900'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          {selected ? 'Selected ✓' : 'Select Position'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpandedPositionId(isExpanded ? null : position.id)}
                          className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>{isExpanded ? 'Less Details' : 'View Duties & Req.'}</span>
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Details */}
                    {isExpanded && (
                      <div className="mt-5 pt-5 border-t border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-6 bg-stone-50/50 p-4 rounded-lg">
                        <div>
                          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-emerald-800" />
                            <span>Key Responsibilities</span>
                          </h4>
                          <ul className="space-y-1.5 text-xs text-stone-600">
                            {position.keyResponsibilities.map((resp, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-emerald-700 font-bold leading-none mt-1">·</span>
                                <span>{resp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                            <span>Requirements & Background</span>
                          </h4>
                          <ul className="space-y-1.5 text-xs text-stone-600">
                            {position.requirements.map((req, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-emerald-700 font-bold leading-none mt-1">·</span>
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            };

            // If no recommendations exist at all, display all roles normally without groupings
            if (!hasAnyRecommendations) {
              return (
                <div className="space-y-4">
                  {filteredPositions.map(renderPositionCard)}
                </div>
              );
            }

            return (
              <div className="space-y-8">
                {/* Recommended for You section */}
                {recommendedPositions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-['Plus_Jakarta_Sans']">
                        Recommended for You ({recommendedPositions.length})
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {recommendedPositions.map(renderPositionCard)}
                    </div>
                  </div>
                )}

                {/* Other Available Roles section */}
                {otherPositions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-stone-600 uppercase tracking-wider font-['Plus_Jakarta_Sans'] pt-2">
                      Other Available Roles ({otherPositions.length})
                    </h3>
                    <div className="space-y-4">
                      {otherPositions.map(renderPositionCard)}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg shadow-xs transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Information</span>
        </button>

        <div className="flex items-center gap-3">
          {selectedPositions.length === 0 && (
            <span className="text-xs text-amber-700 font-medium">
              Please select at least one role to proceed
            </span>
          )}

          <button
            type="button"
            onClick={onNext}
            disabled={selectedPositions.length === 0}
            className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Proceed to Final Review ({selectedPositions.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
