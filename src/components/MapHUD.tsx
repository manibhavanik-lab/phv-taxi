import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  PreSurgeOpportunity, 
  WeatherRadarCell, 
  LTAIncident, 
  ChangiArrivalWave, 
  EventEgress,
  MCPSpatialMapDisplayResponse 
} from '../types/surge';
import { 
  Layers, 
  CloudRain, 
  AlertTriangle, 
  Navigation, 
  Flame, 
  Server, 
  Cpu, 
  Gauge, 
  Radio, 
  RefreshCw,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface MapHUDProps {
  opportunities: PreSurgeOpportunity[];
  selectedOpportunity: PreSurgeOpportunity | null;
  onSelectOpportunity: (opp: PreSurgeOpportunity) => void;
  driverLocation: { name: string; coordinates: [number, number] };
  weatherCells: WeatherRadarCell[];
  ltaIncidents: LTAIncident[];
  flightWaves: ChangiArrivalWave[];
  eventEgresses: EventEgress[];
  isNightMode: boolean;
  filterLayers: {
    weather: boolean;
    incidents: boolean;
    flights: boolean;
    events: boolean;
    surge: boolean;
    speedBands?: boolean;
  };
  onToggleLayer: (layer: keyof MapHUDProps['filterLayers']) => void;
  selectedSector?: string;
}

export const MapHUD: React.FC<MapHUDProps> = ({
  opportunities,
  selectedOpportunity,
  onSelectOpportunity,
  driverLocation,
  weatherCells,
  ltaIncidents,
  isNightMode,
  filterLayers,
  onToggleLayer,
  selectedSector = 'All'
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // MCP Spatial Map Server State
  const [mcpServerStatus, setMcpServerStatus] = useState<{
    serverName: string;
    protocol: string;
    status: 'ONLINE' | 'STREAMING' | 'CONNECTING' | 'DEGRADED';
    latencyMs: number;
    lastPolled: string;
    activeFeaturesCount: number;
    speedBandsCount: number;
  }>({
    serverName: 'mcp-spatial-map-server-singapore',
    protocol: 'MCP Spatial Vector v1.0',
    status: 'CONNECTING',
    latencyMs: 14,
    lastPolled: 'Connecting...',
    activeFeaturesCount: 0,
    speedBandsCount: 0
  });

  const [mcpSpeedBands, setMcpSpeedBands] = useState<Array<{
    road: string;
    speedKmh: number;
    congestionLevel: 'GREEN' | 'AMBER' | 'RED';
    startCoord: [number, number];
    endCoord: [number, number];
  }>>([]);

  const [showMcpMetaBadge, setShowMcpMetaBadge] = useState<boolean>(true);
  const [isRefreshingMcp, setIsRefreshingMcp] = useState<boolean>(false);

  // Fetch live spatial layers from the MCP Spatial Map Server
  const fetchMCPSpatialMapDisplay = async () => {
    setIsRefreshingMcp(true);
    try {
      const startTime = performance.now();
      const queryParams = new URLSearchParams({
        sector: selectedSector,
        lat: driverLocation.coordinates[0].toString(),
        lng: driverLocation.coordinates[1].toString(),
        location: driverLocation.name
      });

      const res = await fetch(`/api/mcp/spatial-map-display?${queryParams.toString()}`);
      if (res.ok) {
        const payload: MCPSpatialMapDisplayResponse = await res.json();
        const clientLatency = Math.round(performance.now() - startTime);

        setMcpServerStatus({
          serverName: payload.server.name,
          protocol: payload.server.protocol,
          status: payload.server.status,
          latencyMs: clientLatency,
          lastPolled: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          activeFeaturesCount: (payload.features.surgeHotspots?.length || 0) +
                               (payload.features.weatherCells?.length || 0) +
                               (payload.features.ltaIncidents?.length || 0),
          speedBandsCount: payload.features.activeSpeedBands?.length || 0
        });

        if (payload.features.activeSpeedBands) {
          setMcpSpeedBands(payload.features.activeSpeedBands);
        }
      }
    } catch (err) {
      console.warn('MCP Spatial Map Server fetch warning:', err);
    } finally {
      setIsRefreshingMcp(false);
    }
  };

  // Poll MCP Map Server periodically (every 12 seconds)
  useEffect(() => {
    fetchMCPSpatialMapDisplay();
    const interval = setInterval(() => {
      fetchMCPSpatialMapDisplay();
    }, 12000);
    return () => clearInterval(interval);
  }, [selectedSector, driverLocation]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [1.3400, 103.8250],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // MCP Spatial Map Server Tile Stream Gateway (replaces 3rd party cartocdn)
    const mcpTileUrl = isNightMode
      ? '/api/mcp/spatial-tiles/night/{z}/{x}/{y}.png'
      : '/api/mcp/spatial-tiles/day/{z}/{x}/{y}.png';

    const tiles = L.tileLayer(mcpTileUrl, {
      maxZoom: 19,
      attribution: '© MCP Spatial Server • OpenStreetMap contributors',
    }).addTo(map);

    tileLayerRef.current = tiles;

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tiles when theme changes
  useEffect(() => {
    if (!tileLayerRef.current || !mapInstanceRef.current) return;
    const mcpTileUrl = isNightMode
      ? '/api/mcp/spatial-tiles/night/{z}/{x}/{y}.png'
      : '/api/mcp/spatial-tiles/day/{z}/{x}/{y}.png';
    tileLayerRef.current.setUrl(mcpTileUrl);
  }, [isNightMode]);

  // Render MCP spatial layers, speed corridors, markers, and radar contours
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. MCP Live Speed Corridors (Traffic Speed Bands)
    if (filterLayers.speedBands !== false && mcpSpeedBands.length > 0) {
      mcpSpeedBands.forEach((band) => {
        const color = band.congestionLevel === 'GREEN' 
          ? '#10b981' 
          : band.congestionLevel === 'AMBER' 
            ? '#f59e0b' 
            : '#ef4444';

        const polyline = L.polyline([band.startCoord, band.endCoord], {
          color,
          weight: 4,
          opacity: 0.85
        });

        polyline.bindTooltip(`
          <div class="p-1 font-mono text-[10px]">
            <span class="font-bold text-white">${band.road}</span><br/>
            <span>MCP Speed Band: <b style="color:${color}">${band.speedKmh} km/h (${band.congestionLevel})</b></span>
          </div>
        `, { sticky: true });

        polyline.addTo(layerGroup);
      });
    }

    // 2. Driver Location Marker
    const driverIcon = L.divIcon({
      className: 'driver-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-cyan-500/30 rounded-full animate-ping"></div>
          <div class="relative z-10 w-7 h-7 rounded-full bg-cyan-500 border-2 border-white shadow-xl flex items-center justify-center text-slate-950 font-bold text-xs">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
            </svg>
          </div>
          <div class="absolute -bottom-5 bg-slate-900/90 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded text-[9px] whitespace-nowrap font-mono shadow-md font-bold">
            YOU
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    L.marker(driverLocation.coordinates, { icon: driverIcon, zIndexOffset: 1000 })
      .bindPopup(`<div class="text-xs font-semibold p-1"><b>Current Position</b><br/>${driverLocation.name}</div>`)
      .addTo(layerGroup);

    // 3. MCP Weather Radar Rain Cells Overlay
    if (filterLayers.weather) {
      weatherCells.forEach(cell => {
        const circle = L.circle([cell.lat, cell.lng], {
          radius: cell.radiusKm * 1000,
          color: '#06b6d4',
          fillColor: '#0891b2',
          fillOpacity: 0.25,
          weight: 1.5,
          dashArray: '3, 3'
        });

        circle.bindTooltip(`
          <div class="p-1 font-mono text-[11px]">
            <span class="font-bold text-cyan-400">🌧️ ${cell.stormType} (MCP Stream)</span><br/>
            <span>Precipitation: <b>${cell.intensityMmHr} mm/hr</b></span><br/>
            <span>Vector: ${cell.movementHeading}</span><br/>
            <span class="text-amber-300 font-bold">Surge Prob: ${cell.surgeProbability}%</span>
          </div>
        `, { sticky: true });

        circle.addTo(layerGroup);
      });
    }

    // 4. MCP LTA Traffic & Rail Incident Markers
    if (filterLayers.incidents) {
      ltaIncidents.forEach(inc => {
        const isCritical = inc.severity === 'CRITICAL';
        const incIcon = L.divIcon({
          className: 'incident-marker',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer">
              <div class="absolute w-6 h-6 ${isCritical ? 'bg-rose-500/30 animate-pulse' : 'bg-amber-500/20'} rounded-full"></div>
              <div class="relative w-5 h-5 rounded-md ${isCritical ? 'bg-rose-600 text-white border-rose-300' : 'bg-amber-500 text-slate-950 border-amber-300'} border shadow-md flex items-center justify-center text-[10px] font-bold">
                ⚠️
              </div>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        L.marker([inc.lat, inc.lng], { icon: incIcon })
          .bindPopup(`
            <div class="p-1 font-sans text-xs">
              <div class="font-bold text-rose-500 uppercase tracking-wider mb-0.5">${inc.type.replace('_', ' ')} (MCP LTA EMAS)</div>
              <div class="font-semibold text-slate-900 dark:text-white">${inc.location}</div>
              <p class="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">${inc.description}</p>
              <div class="text-[10px] text-amber-500 font-mono mt-1 font-bold">Stranded commuters: ~${inc.strandedCommutersEst}</div>
            </div>
          `)
          .addTo(layerGroup);
      });
    }

    // 5. MCP Pre-Surge Hotspot Flame Markers & Heat Buffers
    if (filterLayers.surge) {
      opportunities.forEach(opp => {
        const isSelected = selectedOpportunity?.id === opp.id;
        const multiplier = opp.predictedMultiplier.toFixed(1);

        const surgeIcon = L.divIcon({
          className: 'surge-marker',
          html: `
            <div class="relative flex flex-col items-center justify-center cursor-pointer transition-transform ${isSelected ? 'scale-110 z-50' : 'scale-95 hover:scale-105'}">
              <div class="absolute -inset-1 rounded-full ${opp.priority === 'URGENT' ? 'bg-rose-500/40 animate-ping' : 'bg-amber-500/30'}"></div>
              <div class="relative px-1.5 py-0.5 rounded-full ${opp.priority === 'URGENT' ? 'bg-gradient-to-r from-rose-600 to-amber-600' : 'bg-gradient-to-r from-amber-600 to-emerald-600'} text-white font-black text-[10px] shadow-lg border ${isSelected ? 'border-white ring-2 ring-rose-500/50' : 'border-amber-300'} flex items-center gap-0.5">
                <span>🔥</span>
                <span>${multiplier}x</span>
              </div>
              <div class="mt-0.5 bg-slate-950/90 text-white text-[9px] font-mono px-1 py-0.2 rounded border border-slate-700 shadow max-w-[100px] truncate text-center">
                ${opp.zoneName.split('/')[0]}
              </div>
            </div>
          `,
          iconSize: [52, 38],
          iconAnchor: [26, 19]
        });

        L.marker(opp.coordinates, { icon: surgeIcon, zIndexOffset: isSelected ? 500 : 200 })
          .on('click', () => {
            onSelectOpportunity(opp);
          })
          .addTo(layerGroup);

        L.circle(opp.coordinates, {
          radius: 1000,
          color: opp.priority === 'URGENT' ? '#ef4444' : '#f59e0b',
          fillColor: opp.priority === 'URGENT' ? '#ef4444' : '#f59e0b',
          fillOpacity: isSelected ? 0.20 : 0.10,
          weight: isSelected ? 2 : 1,
          dashArray: isSelected ? undefined : '2, 2'
        }).addTo(layerGroup);
      });
    }

    // 6. Draw MCP Tactical Route Polyline
    if (selectedOpportunity) {
      const routePoints: [number, number][] = [
        driverLocation.coordinates,
        [
          (driverLocation.coordinates[0] + selectedOpportunity.coordinates[0]) / 2 + 0.003,
          (driverLocation.coordinates[1] + selectedOpportunity.coordinates[1]) / 2 - 0.005
        ],
        selectedOpportunity.coordinates
      ];

      L.polyline(routePoints, {
        color: '#06b6d4',
        weight: 3.5,
        opacity: 0.9,
        dashArray: '5, 5'
      }).addTo(layerGroup);

      const bounds = L.latLngBounds([driverLocation.coordinates, selectedOpportunity.coordinates]);
      map.flyToBounds(bounds.pad(0.35), { duration: 0.6 });
    }
  }, [opportunities, selectedOpportunity, driverLocation, weatherCells, ltaIncidents, filterLayers, mcpSpeedBands]);

  return (
    <div className="relative w-full h-full min-h-0 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-xl flex flex-col">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 z-0" />

      {/* Layer Filter Controls Overlay */}
      <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700/80 shadow-md">
        <div className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <Layers className="w-3 h-3 text-cyan-400" />
          <span className="hidden sm:inline">HUD</span>
        </div>

        <button
          onClick={() => onToggleLayer('surge')}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
            filterLayers.surge
              ? 'bg-rose-600/90 text-white shadow-sm'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-2.5 h-2.5 text-amber-300" />
          <span>Surge</span>
        </button>

        <button
          onClick={() => onToggleLayer('weather')}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
            filterLayers.weather
              ? 'bg-cyan-600/90 text-white shadow-sm'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <CloudRain className="w-2.5 h-2.5 text-cyan-300" />
          <span>Rain</span>
        </button>

        <button
          onClick={() => onToggleLayer('incidents')}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
            filterLayers.incidents
              ? 'bg-amber-600/90 text-white shadow-sm'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-2.5 h-2.5 text-amber-200" />
          <span>LTA</span>
        </button>
      </div>

      {/* MCP Server Live Spatial Streaming Telemetry Badge (Top Right) */}
      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
        <div className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-cyan-500/40 shadow-xl flex items-center gap-2 text-white">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-bold text-cyan-300 flex items-center gap-1 leading-none">
                <Server className="w-2.5 h-2.5" />
                <span>MCP MAP SERVER</span>
              </span>
              <span className="text-[8px] font-mono text-slate-400 leading-none mt-0.5">
                {mcpServerStatus.latencyMs}ms • {mcpServerStatus.speedBandsCount} Corridors
              </span>
            </div>
          </div>

          <button
            onClick={fetchMCPSpatialMapDisplay}
            title="Poll MCP Spatial Map Server Now"
            disabled={isRefreshingMcp}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 disabled:opacity-40 transition-all"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshingMcp ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Selected Route Quick Telemetry Badge */}
      {selectedOpportunity && (
        <div className="absolute bottom-2.5 left-2.5 right-12 z-20 bg-slate-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-cyan-500/40 shadow-xl flex items-center justify-between gap-2 text-white">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded bg-gradient-to-br from-rose-600 to-amber-500 flex items-center justify-center font-black text-xs shrink-0 shadow">
              {selectedOpportunity.predictedMultiplier}x
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold truncate text-slate-100 flex items-center gap-1">
                <span>{selectedOpportunity.zoneName}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  ETA {selectedOpportunity.driverEtaMinutes}m
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {selectedOpportunity.recommendedRoute}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[11px] font-mono font-bold text-emerald-400">
              {selectedOpportunity.estimatedFareBoost}
            </div>
            <div className="text-[9px] text-amber-300 font-mono">
              Locks in {selectedOpportunity.timeToPublicSurgeMinutes}m
            </div>
          </div>
        </div>
      )}

      {/* Recenter button */}
      <button
        onClick={() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(driverLocation.coordinates, 13);
          }
        }}
        title="Recenter on your vehicle"
        aria-label="Recenter map on your vehicle"
        className="absolute bottom-2.5 right-2.5 z-20 w-8 h-8 rounded-lg bg-slate-900/90 text-cyan-400 border border-slate-700 hover:border-cyan-500 flex items-center justify-center shadow-md transition-all"
      >
        <Navigation className="w-4 h-4" />
      </button>
    </div>
  );
};
