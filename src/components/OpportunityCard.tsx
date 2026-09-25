import React, { useState } from 'react';
import { PreSurgeOpportunity } from '../types/surge';
import { 
  Flame, 
  Navigation, 
  Volume2, 
  ChevronDown, 
  ChevronUp, 
  CloudRain,
  Train,
  Plane,
  Music,
  AlertCircle
} from 'lucide-react';
import { speakDispatchAlert } from '../utils/audioDispatch';

interface OpportunityCardProps {
  opportunity: PreSurgeOpportunity;
  isSelected: boolean;
  onSelect: () => void;
  voiceEnabled: boolean;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  isSelected,
  onSelect
}) => {
  const [showEvidence, setShowEvidence] = useState(false);

  const getCatalystIcon = () => {
    switch (opportunity.catalystType) {
      case 'weather':
        return <CloudRain className="w-3 h-3 text-cyan-400" />;
      case 'mrt_disruption':
        return <Train className="w-3 h-3 text-amber-400" />;
      case 'flight_wave':
        return <Plane className="w-3 h-3 text-sky-400" />;
      case 'concert_egress':
      case 'nightlife_rush':
        return <Music className="w-3 h-3 text-purple-400" />;
      default:
        return <AlertCircle className="w-3 h-3 text-rose-400" />;
    }
  };

  const handleVoiceDispatch = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Surge Alert for ${opportunity.zoneName}. Predicted ${opportunity.predictedMultiplier} times surge. Public surge triggers in ${opportunity.timeToPublicSurgeMinutes} minutes. ${opportunity.recommendedAction}`;
    speakDispatchAlert(text, true);
  };

  const handleOpenNav = (e: React.MouseEvent) => {
    e.stopPropagation();
    const [lat, lng] = opportunity.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const isUrgent = opportunity.priority === 'URGENT';
  const timeCritical = opportunity.timeToPublicSurgeMinutes <= 6;

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl p-2.5 transition-all duration-150 cursor-pointer border ${
        isSelected
          ? 'bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
          : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Banner: Urgency & Timing */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-black uppercase tracking-wider ${
              isUrgent
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {isUrgent && <span className="w-1 h-1 rounded-full bg-rose-500 animate-ping" />}
            <span>{opportunity.priority}</span>
          </span>

          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
            {getCatalystIcon()}
            <span className="capitalize">{opportunity.catalystType.replace('_', ' ')}</span>
          </span>
        </div>

        <div className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
          {opportunity.confidenceScore}% MCP Confidence
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-bold text-white leading-tight truncate">
            {opportunity.zoneName}
          </h3>
          <p className="text-[11px] text-slate-400 line-clamp-1">
            {opportunity.title}
          </p>
        </div>

        {/* Multiplier Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="text-right">
            <span className="text-[9px] text-slate-500 uppercase font-mono block">Current</span>
            <span className="text-[11px] font-mono font-bold text-slate-400 line-through">
              {opportunity.currentMultiplier.toFixed(1)}x
            </span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-amber-400 uppercase font-mono font-bold block">Pre-Surge</span>
            <span className="text-xs font-black font-mono text-white bg-gradient-to-r from-rose-500 to-amber-500 px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
              <Flame className="w-3 h-3 fill-amber-300 text-amber-300" />
              <span>{opportunity.predictedMultiplier.toFixed(1)}x</span>
            </span>
          </div>
        </div>
      </div>

      {/* Telemetry Numbers */}
      <div className="grid grid-cols-3 gap-1 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80 mb-1.5 text-center text-[10px]">
        <div>
          <div className="text-slate-400 font-medium">Surge In</div>
          <div className={`font-mono font-black ${timeCritical ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
            ⏱️ {opportunity.timeToPublicSurgeMinutes} MINS
          </div>
        </div>
        <div>
          <div className="text-slate-400 font-medium">Your ETA</div>
          <div className="font-mono font-black text-cyan-400">
            🚗 {opportunity.driverEtaMinutes} MINS
          </div>
        </div>
        <div>
          <div className="text-slate-400 font-medium">Fare Boost</div>
          <div className="font-mono font-black text-emerald-400 truncate">
            {opportunity.estimatedFareBoost}
          </div>
        </div>
      </div>

      {/* Recommended Action / Staging */}
      <div className="text-[11px] text-slate-300 mb-2 line-clamp-2">
        <span className="text-cyan-400 font-bold">Staging: </span>
        {opportunity.recommendedAction}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
        <button
          onClick={handleOpenNav}
          className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold text-[11px] shadow transition-all"
        >
          <Navigation className="w-3 h-3" />
          <span>Drive Now</span>
        </button>

        <button
          onClick={handleVoiceDispatch}
          title="Play Voice Audio Dispatch"
          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
        >
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowEvidence(!showEvidence);
          }}
          className="flex items-center gap-0.5 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition-all"
        >
          <span>MCP Signals</span>
          {showEvidence ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Collapsible MCP Signals Drawer */}
      {showEvidence && (
        <div className="mt-2 pt-1.5 border-t border-slate-800 space-y-1">
          {opportunity.mcpEvidence.map((ev, idx) => (
            <div
              key={idx}
              className="bg-slate-950 p-1.5 rounded border border-slate-800/90 flex items-center justify-between text-[10px]"
            >
              <div className="truncate mr-2">
                <span className="font-mono text-cyan-400 block text-[9px] truncate">{ev.tool}</span>
                <span className="text-slate-300 font-semibold">{ev.metric}</span>
              </div>
              <div className="shrink-0">
                <span
                  className={`px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
                    ev.signal === 'critical'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {ev.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
