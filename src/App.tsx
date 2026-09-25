/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  PreSurgeOpportunity, 
  WeatherRadarCell, 
  LTAIncident, 
  ChangiArrivalWave, 
  EventEgress, 
  CopilotIntelResponse, 
  DriverState,
  Sector 
} from './types/surge';
import { 
  INITIAL_PRE_SURGE_OPPORTUNITIES, 
  INITIAL_WEATHER_RADAR, 
  INITIAL_LTA_INCIDENTS, 
  INITIAL_CHANGI_ARRIVALS, 
  INITIAL_EVENT_EGRESS,
  SINGAPORE_ZONES 
} from './data/singaporeData';
import { HeaderHUD } from './components/HeaderHUD';
import { MapHUD } from './components/MapHUD';
import { OpportunityCard } from './components/OpportunityCard';
import { AICopilotChat } from './components/AICopilotChat';
import { MCPInspectorDrawer } from './components/MCPInspectorDrawer';
import { ShiftTrackerModal } from './components/ShiftTrackerModal';
import { AskAgentPanel } from './components/AskAgentPanel';
import { speakDispatchAlert } from './utils/audioDispatch';
import { 
  Flame, 
  RefreshCw, 
  ArrowUpDown, 
  AlertCircle,
  X,
  Bot
} from 'lucide-react';

export default function App() {
  const [opportunities, setOpportunities] = useState<PreSurgeOpportunity[]>(INITIAL_PRE_SURGE_OPPORTUNITIES);
  const [selectedOpportunity, setSelectedOpportunity] = useState<PreSurgeOpportunity | null>(INITIAL_PRE_SURGE_OPPORTUNITIES[0]);
  const [weatherCells, setWeatherCells] = useState<WeatherRadarCell[]>(INITIAL_WEATHER_RADAR);
  const [ltaIncidents, setLtaIncidents] = useState<LTAIncident[]>(INITIAL_LTA_INCIDENTS);
  const [flightWaves, setFlightWaves] = useState<ChangiArrivalWave[]>(INITIAL_CHANGI_ARRIVALS);
  const [eventEgresses, setEventEgresses] = useState<EventEgress[]>(INITIAL_EVENT_EGRESS);

  // Cockpit view toggle on right pane (Pre-surge feed vs Ask Agent)
  const [rightTab, setRightTab] = useState<'feed' | 'ask'>('feed');

  // Driver GPS and Settings
  const [driverLocation, setDriverLocation] = useState({
    name: 'Novena / Newton',
    sector: 'Central' as Sector,
    coordinates: [1.3204, 103.8438] as [number, number]
  });

  const [platform, setPlatform] = useState<string>('All');
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [sortOption, setSortOption] = useState<'urgency' | 'multiplier' | 'eta' | 'fare'>('urgency');
  
  // Tactical HUD modes
  const [isNightMode, setIsNightMode] = useState<boolean>(true);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [isMCPDrawerOpen, setIsMCPDrawerOpen] = useState<boolean>(false);
  const [isShiftTrackerOpen, setIsShiftTrackerOpen] = useState<boolean>(false);
  const [isAskAgentOpen, setIsAskAgentOpen] = useState<boolean>(false);

  // Map Layer filters
  const [filterLayers, setFilterLayers] = useState<{
    weather: boolean;
    incidents: boolean;
    flights: boolean;
    events: boolean;
    surge: boolean;
    speedBands: boolean;
  }>({
    weather: true,
    incidents: true,
    flights: true,
    events: true,
    surge: true,
    speedBands: true
  });

  // Driver performance metrics
  const [driverState, setDriverState] = useState<DriverState>({
    currentLocationName: 'Novena / Newton',
    sector: 'Central',
    lat: 1.3204,
    lng: 103.8438,
    platform: 'All',
    vehicleType: '4-Seater',
    todayEarnings: 184.50,
    tripsCompleted: 6,
    surgeBonusCaptured: 68.0,
    idleReductionMins: 42,
    voiceHUDEnabled: true,
    audioDispatchVolume: 0.9
  });

  // Copilot Intel from Gemini
  const [copilotIntel, setCopilotIntel] = useState<CopilotIntelResponse | null>(null);
  const [isLoadingIntel, setIsLoadingIntel] = useState<boolean>(false);

  // Fetch opportunities from server
  const fetchOpportunities = useCallback(async () => {
    try {
      const res = await fetch('/api/pre-surge/opportunities');
      if (res.ok) {
        const data = await res.json();
        if (data.opportunities) setOpportunities(data.opportunities);
        if (data.weatherCells) setWeatherCells(data.weatherCells);
        if (data.ltaIncidents) setLtaIncidents(data.ltaIncidents);
        if (data.flightWaves) setFlightWaves(data.flightWaves);
        if (data.eventEgresses) setEventEgresses(data.eventEgresses);
      }
    } catch (e) {
      console.warn('Using local fallback state for opportunities:', e);
    }
  }, []);

  // Fetch AI Copilot Intel from server
  const fetchCopilotIntel = useCallback(async () => {
    setIsLoadingIntel(true);
    try {
      const res = await fetch('/api/copilot/intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverLocation: driverLocation.name,
          platform,
          currentEarnings: driverState.todayEarnings,
          vehicleType: driverState.vehicleType
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.intel) {
          setCopilotIntel(data.intel);
        }
      }
    } catch (e) {
      console.warn('Copilot intel fetch error:', e);
    } finally {
      setIsLoadingIntel(false);
    }
  }, [driverLocation.name, platform, driverState.todayEarnings, driverState.vehicleType]);

  useEffect(() => {
    fetchOpportunities();
    fetchCopilotIntel();
  }, [fetchOpportunities, fetchCopilotIntel]);

  // Voice announcement on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (voiceEnabled) {
        speakDispatchAlert('Surge S G Fleet Co-Pilot online. Single-page HUD operational.', true);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Trigger scenario
  const handleTriggerScenario = async (scenarioId: string) => {
    try {
      const res = await fetch('/api/simulator/trigger-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.activeOpportunities) {
          setOpportunities(data.activeOpportunities);
          if (data.activeOpportunities.length > 0) {
            setSelectedOpportunity(data.activeOpportunities[0]);
            if (voiceEnabled) {
              speakDispatchAlert(`Urgent alert! New catalyst detected: ${data.activeOpportunities[0].title}.`, true);
            }
          }
        }
        fetchCopilotIntel();
      }
    } catch (e) {
      console.error('Trigger scenario error:', e);
    }
  };

  // Execute MCP tool
  const handleExecuteMCPTool = async (toolName: string, params: any) => {
    const res = await fetch('/api/mcp/invoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolName, parameters: params })
    });
    return await res.json();
  };

  // Driver Location Change
  const handleSelectLocation = (zoneName: string) => {
    const zone = SINGAPORE_ZONES.find(z => z.name === zoneName);
    if (zone) {
      setDriverLocation({
        name: zone.name,
        sector: zone.sector,
        coordinates: zone.coordinates
      });
      setDriverState(prev => ({
        ...prev,
        currentLocationName: zone.name,
        sector: zone.sector,
        lat: zone.coordinates[0],
        lng: zone.coordinates[1]
      }));

      // Recalculate Driver ETA for opportunities
      setOpportunities(prev => prev.map(opp => {
        const dLat = Math.abs(opp.coordinates[0] - zone.coordinates[0]);
        const dLng = Math.abs(opp.coordinates[1] - zone.coordinates[1]);
        const distKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
        const newEta = Math.max(3, Math.round(distKm * 2.2));
        return {
          ...opp,
          driverEtaMinutes: newEta
        };
      }));
    }
  };

  // Filter & Sort opportunities
  const filteredOpportunities = opportunities
    .filter(opp => {
      if (selectedSector !== 'All' && opp.sector !== selectedSector) return false;
      if (platform !== 'All' && !opp.affectedPlatforms.includes(platform as any)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'urgency') return a.timeToPublicSurgeMinutes - b.timeToPublicSurgeMinutes;
      if (sortOption === 'multiplier') return b.predictedMultiplier - a.predictedMultiplier;
      if (sortOption === 'eta') return a.driverEtaMinutes - b.driverEtaMinutes;
      if (sortOption === 'fare') return b.expectedNetHourly - a.expectedNetHourly;
      return 0;
    });

  return (
    <div className={`h-screen max-h-screen w-screen overflow-hidden ${isNightMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} flex flex-col font-sans select-none`}>
      {/* Tactical HUD Header */}
      <HeaderHUD
        currentLocationName={driverLocation.name}
        onSelectLocation={handleSelectLocation}
        platform={platform}
        onSelectPlatform={setPlatform}
        isNightMode={isNightMode}
        onToggleNightMode={() => setIsNightMode(!isNightMode)}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
        onOpenMCPDrawer={() => setIsMCPDrawerOpen(true)}
        onOpenShiftTracker={() => setIsShiftTrackerOpen(true)}
        onTriggerScenario={handleTriggerScenario}
        todayEarnings={driverState.todayEarnings}
        surgeOpportunitiesCount={opportunities.length}
        isAskAgentOpen={isAskAgentOpen}
        onToggleAskAgent={() => setIsAskAgentOpen(!isAskAgentOpen)}
      />

      {/* Main Single-Page Cockpit Viewport */}
      <main className="flex-1 min-h-0 w-full p-2 sm:p-2.5 flex flex-col md:flex-row gap-2.5 overflow-hidden">
        {/* Left Side: Spatial Radar Map HUD + AI Copilot Intelligence */}
        <div className="flex-[7] min-h-0 h-full flex flex-col gap-2 overflow-hidden">
          {/* Spatial Leaflet HUD */}
          <div className="flex-1 min-h-0 w-full relative">
            <MapHUD
              opportunities={opportunities}
              selectedOpportunity={selectedOpportunity}
              onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
              driverLocation={driverLocation}
              weatherCells={weatherCells}
              ltaIncidents={ltaIncidents}
              flightWaves={flightWaves}
              eventEgresses={eventEgresses}
              isNightMode={isNightMode}
              filterLayers={filterLayers}
              onToggleLayer={(layer) => setFilterLayers(prev => ({ ...prev, [layer]: !prev[layer] }))}
              selectedSector={selectedSector}
            />
          </div>

          {/* AI Copilot Dispatch & Chat */}
          <AICopilotChat
            driverLocation={driverLocation.name}
            selectedOpportunity={selectedOpportunity}
            intel={copilotIntel}
            isLoadingIntel={isLoadingIntel}
            onRefreshIntel={fetchCopilotIntel}
            voiceEnabled={voiceEnabled}
          />
        </div>

        {/* Right Side: Pre-Surge Opportunity Feed OR Ask Agent Panel */}
        <div className="flex-[5] min-h-0 h-full flex flex-col gap-2 overflow-hidden">
          {/* Top Segmented Tab Switcher */}
          <div className="shrink-0 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800/80">
              <button
                onClick={() => setRightTab('feed')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                  rightTab === 'feed'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>PRE-SURGE ({filteredOpportunities.length})</span>
              </button>
              <button
                onClick={() => setRightTab('ask')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                  rightTab === 'ask'
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-sm ring-1 ring-cyan-400/50'
                    : 'text-indigo-300 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>ASK AGENT</span>
              </button>
            </div>

            {rightTab === 'feed' ? (
              <div className="flex items-center gap-1">
                {/* Sector Tabs */}
                <div className="hidden sm:flex items-center gap-0.5">
                  {['All', 'Central', 'East', 'West'].map(sec => (
                    <button
                      key={sec}
                      onClick={() => setSelectedSector(sec)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                        selectedSector === sec
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[10px]">
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="bg-transparent text-slate-300 font-bold focus:outline-none cursor-pointer text-[10px]"
                  >
                    <option value="urgency" className="bg-slate-900">Urgency</option>
                    <option value="multiplier" className="bg-slate-900">Multiplier</option>
                    <option value="eta" className="bg-slate-900">Closest</option>
                    <option value="fare" className="bg-slate-900">Yield</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    fetchOpportunities();
                    fetchCopilotIntel();
                  }}
                  title="Refresh MCP Feeds"
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono pr-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>MCP Tool-Calling Active</span>
              </div>
            )}
          </div>

          {/* Tab Content */}
          {rightTab === 'ask' ? (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <AskAgentPanel />
            </div>
          ) : (
            /* Scrollable list strictly contained inside this column pane */
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5">
              {filteredOpportunities.length === 0 ? (
                <div className="p-6 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-slate-400">
                  <AlertCircle className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
                  <div className="text-xs font-bold text-slate-300">No Pre-Surge Hotspots in this sector</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Try switching to 'All' sector above.</p>
                </div>
              ) : (
                filteredOpportunities.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    isSelected={selectedOpportunity?.id === opp.id}
                    onSelect={() => setSelectedOpportunity(opp)}
                    voiceEnabled={voiceEnabled}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Model Context Protocol Tools Drawer */}
      <MCPInspectorDrawer
        isOpen={isMCPDrawerOpen}
        onClose={() => setIsMCPDrawerOpen(false)}
        onExecuteTool={handleExecuteMCPTool}
      />

      {/* Ask Agent Panel Modal */}
      {isAskAgentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden rounded-2xl border border-cyan-500/50 shadow-2xl bg-slate-900">
            {/* Close Button */}
            <button
              onClick={() => setIsAskAgentOpen(false)}
              className="absolute top-3 right-3 z-10 p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Close Ask Agent"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="overflow-y-auto p-1">
              <AskAgentPanel />
            </div>
          </div>
        </div>
      )}

      {/* Shift Tracker Modal */}
      <ShiftTrackerModal
        isOpen={isShiftTrackerOpen}
        onClose={() => setIsShiftTrackerOpen(false)}
        driverState={driverState}
        onUpdateVehicleType={(v) => {
          setDriverState(prev => ({ ...prev, vehicleType: v }));
          fetchCopilotIntel();
        }}
        onResetShift={() => {
          setDriverState(prev => ({
            ...prev,
            todayEarnings: 0,
            tripsCompleted: 0,
            surgeBonusCaptured: 0,
            idleReductionMins: 0
          }));
        }}
      />
    </div>
  );
}
