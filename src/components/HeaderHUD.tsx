import React, { useState } from 'react';
import { 
  Zap, 
  MapPin, 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  Cpu, 
  DollarSign, 
  Sparkles, 
  RefreshCw
} from 'lucide-react';
import { SINGAPORE_ZONES } from '../data/singaporeData';

interface HeaderHUDProps {
  currentLocationName: string;
  onSelectLocation: (zoneName: string) => void;
  platform: string;
  onSelectPlatform: (platform: string) => void;
  isNightMode: boolean;
  onToggleNightMode: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onOpenMCPDrawer: () => void;
  onOpenShiftTracker: () => void;
  onTriggerScenario: (scenarioId: string) => void;
  todayEarnings: number;
  surgeOpportunitiesCount: number;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  currentLocationName,
  onSelectLocation,
  platform,
  onSelectPlatform,
  isNightMode,
  onToggleNightMode,
  voiceEnabled,
  onToggleVoice,
  onOpenMCPDrawer,
  onOpenShiftTracker,
  onTriggerScenario,
  todayEarnings
}) => {
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);

  return (
    <header className="w-full h-12 shrink-0 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white px-3 flex items-center justify-between z-30 shadow-md">
      {/* Brand & Status */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-rose-600 p-0.5 shadow-md shadow-cyan-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-black tracking-tight font-mono bg-gradient-to-r from-white via-cyan-200 to-amber-300 bg-clip-text text-transparent">
            SURGESG
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            PRE-SURGE
          </span>
          <span className="hidden md:flex items-center gap-1 text-[10px] text-slate-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>MCP v1.0 LIVE</span>
          </span>
        </div>
      </div>

      {/* Driver Telemetry & Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
        {/* Driver Location Picker */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 px-2 py-1 rounded-lg text-xs shrink-0">
          <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
          <select
            value={currentLocationName}
            onChange={(e) => onSelectLocation(e.target.value)}
            className="bg-transparent text-white font-bold text-[11px] focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[180px] truncate"
          >
            {SINGAPORE_ZONES.map(z => (
              <option key={z.id} value={z.name} className="bg-slate-900 text-white">
                {z.name}
              </option>
            ))}
          </select>
        </div>

        {/* Platform Filter Buttons */}
        <div className="hidden lg:flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-[11px] font-semibold shrink-0">
          {['All', 'Grab', 'Gojek', 'Tada', 'Taxi'].map(p => (
            <button
              key={p}
              onClick={() => onSelectPlatform(p)}
              className={`px-2 py-0.5 rounded transition-all ${
                platform === p
                  ? 'bg-cyan-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Shift Revenue Button */}
        <button
          onClick={onOpenShiftTracker}
          className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 px-2 py-1 rounded-lg text-[11px] text-emerald-400 font-mono font-bold shadow-sm transition-all shrink-0"
        >
          <DollarSign className="w-3 h-3" />
          <span>${todayEarnings.toFixed(0)}</span>
          <span className="text-[9px] text-emerald-300 font-normal hidden xl:inline">Shift</span>
        </button>

        {/* Simulator Scenario Injector */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowScenarioMenu(!showScenarioMenu)}
            className="flex items-center gap-1 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 px-2 py-1 rounded-lg text-[11px] text-rose-300 font-bold transition-all shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span className="hidden sm:inline">Simulate</span>
          </button>

          {showScenarioMenu && (
            <div className="absolute right-0 mt-1 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs">
              <div className="px-2 py-1 font-mono uppercase text-[9px] text-slate-400 border-b border-slate-800 mb-1">
                Inject Live Disruption:
              </div>
              <button
                onClick={() => {
                  onTriggerScenario('mrt_circle_line');
                  setShowScenarioMenu(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-start gap-1.5"
              >
                <span className="text-amber-400">🚇</span>
                <div>
                  <div className="font-bold text-[11px]">Serangoon MRT Power Trip</div>
                  <div className="text-[9px] text-slate-400">5,200 pax crowd surge at NEX</div>
                </div>
              </button>
              <button
                onClick={() => {
                  onTriggerScenario('monsoon_orchard');
                  setShowScenarioMenu(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-start gap-1.5"
              >
                <span className="text-cyan-400">🌧️</span>
                <div>
                  <div className="font-bold text-[11px]">Orchard Monsoon Downpour</div>
                  <div className="text-[9px] text-slate-400">Surge escalates to 3.1x</div>
                </div>
              </button>
              <button
                onClick={() => {
                  onTriggerScenario('reset');
                  setShowScenarioMenu(false);
                }}
                className="w-full text-left px-2 py-1 rounded-lg hover:bg-slate-800 text-rose-400 flex items-center gap-1.5 border-t border-slate-800 mt-1 text-[11px]"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Scenarios</span>
              </button>
            </div>
          )}
        </div>

        {/* MCP Tools Button */}
        <button
          onClick={onOpenMCPDrawer}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-400 text-[11px] font-mono font-bold transition-all shrink-0"
        >
          <Cpu className="w-3 h-3" />
          <span className="hidden sm:inline">MCP Tools</span>
          <span className="sm:hidden">(6)</span>
        </button>

        {/* Voice Audio HUD Toggle */}
        <button
          onClick={onToggleVoice}
          title={voiceEnabled ? 'Voice HUD Active' : 'Voice HUD Muted'}
          className={`p-1.5 rounded-lg border text-xs transition-all shrink-0 ${
            voiceEnabled
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
              : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}
        >
          {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Day/Night Mode Toggle */}
        <button
          onClick={onToggleNightMode}
          title={isNightMode ? 'Switch to Anti-Glare Daylight Mode' : 'Switch to Tactical Night Mode'}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 transition-all shrink-0"
        >
          {isNightMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5 text-cyan-400" />}
        </button>
      </div>
    </header>
  );
};
