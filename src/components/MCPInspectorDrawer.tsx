import React, { useState } from 'react';
import { MCPToolDef } from '../types/surge';
import { REGISTERED_MCP_TOOLS } from '../data/singaporeData';
import { 
  X, 
  Cpu, 
  Play, 
  CheckCircle2, 
  Terminal, 
  Activity, 
  Clock, 
  Layers,
  ArrowRight,
  Database,
  Radio
} from 'lucide-react';

interface MCPInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteTool: (toolName: string, params: any) => Promise<any>;
}

export const MCPInspectorDrawer: React.FC<MCPInspectorDrawerProps> = ({
  isOpen,
  onClose,
  onExecuteTool
}) => {
  const [selectedTool, setSelectedTool] = useState<MCPToolDef>(REGISTERED_MCP_TOOLS[0]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<any>(null);
  const [customParamJson, setCustomParamJson] = useState('{\n  "sector": "Central",\n  "minIntensityMm": 30\n}');

  if (!isOpen) return null;

  const handleRunTool = async () => {
    setIsExecuting(true);
    try {
      let params = {};
      try {
        params = JSON.parse(customParamJson);
      } catch (e) {
        params = {};
      }
      const res = await onExecuteTool(selectedTool.name, params);
      setExecutionOutput(res);
    } catch (err: any) {
      setExecutionOutput({ error: err.message || 'Execution error' });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSelectTool = (tool: MCPToolDef) => {
    setSelectedTool(tool);
    if (tool.name === 'mcp_singapore_weather_radar') {
      setCustomParamJson('{\n  "sector": "Central",\n  "minIntensityMm": 30\n}');
    } else if (tool.name === 'mcp_lta_traffic_incidents') {
      setCustomParamJson('{\n  "expressway": "PIE",\n  "severityFilter": "CRITICAL"\n}');
    } else if (tool.name === 'mcp_changi_airport_ops') {
      setCustomParamJson('{\n  "terminal": "T3",\n  "timeWindowMins": 30\n}');
    } else if (tool.name === 'mcp_entertainment_event_egress') {
      setCustomParamJson('{\n  "venueId": "national_stadium",\n  "minAttendees": 10000\n}');
    } else if (tool.name === 'mcp_spatial_travel_matrix') {
      setCustomParamJson('{\n  "originCoords": [1.3204, 103.8438],\n  "destinationZone": "Kallang",\n  "trafficAdjusted": true\n}');
    } else if (tool.name === 'mcp_spatial_map_display') {
      setCustomParamJson('{\n  "sectorFilter": "Central",\n  "layerTypes": ["surge", "weather", "incidents", "speed_bands"],\n  "driverCoordinates": [1.3204, 103.8438]\n}');
    } else {
      setCustomParamJson('{\n  "zone": "National Stadium Kallang",\n  "currentDemandPax": 7400,\n  "supplyCabs": 48\n}');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl h-full bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col text-white animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono text-cyan-300">
                MCP (Model Context Protocol) Tools Console
              </h2>
              <p className="text-[11px] text-slate-400">
                Inspect, invoke, and verify real-time transport sensor pipelines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Tool Selector Tabs */}
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Registered Sensor Tools ({REGISTERED_MCP_TOOLS.length}):</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {REGISTERED_MCP_TOOLS.map((tool) => {
                const active = selectedTool.name === tool.name;
                return (
                  <button
                    key={tool.name}
                    onClick={() => handleSelectTool(tool)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                      active
                        ? 'bg-cyan-950/50 border-cyan-500 text-cyan-200 shadow-md ring-1 ring-cyan-500/30'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-mono font-bold truncate flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{tool.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-1">
                      {tool.sourceApi}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tool Details */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {selectedTool.name}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {selectedTool.status} ({selectedTool.refreshRate})
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {selectedTool.description}
              </p>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span className="font-bold text-slate-300">Data Source:</span>
              <span className="font-mono text-cyan-300">{selectedTool.sourceApi}</span>
            </div>

            {/* Parameter Editor */}
            <div>
              <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center justify-between">
                <span>Input Payload (JSON):</span>
                <span className="text-[10px] text-slate-500">Edit values to test scenarios</span>
              </div>
              <textarea
                value={customParamJson}
                onChange={(e) => setCustomParamJson(e.target.value)}
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-mono text-xs text-cyan-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunTool}
              disabled={isExecuting}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isExecuting ? 'Executing Pipeline...' : 'Invoke MCP Tool Call'}</span>
            </button>
          </div>

          {/* Execution Output */}
          {executionOutput && (
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Execution Result: {executionOutput.executionTimeMs || 18}ms</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  {executionOutput.timestamp}
                </span>
              </div>

              {executionOutput.summary && (
                <div className="p-2 rounded bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200">
                  <b>Synthesis:</b> {executionOutput.summary}
                </div>
              )}

              <div className="text-[10px] font-mono uppercase text-slate-400">Raw JSON Payload:</div>
              <pre className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-60">
                {JSON.stringify(executionOutput.data || executionOutput, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
