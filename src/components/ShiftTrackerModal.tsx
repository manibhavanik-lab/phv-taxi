import React from 'react';
import { X, DollarSign, Clock, TrendingUp, Award, ShieldCheck, Car } from 'lucide-react';
import { DriverState } from '../types/surge';

interface ShiftTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverState: DriverState;
  onUpdateVehicleType: (vehicle: DriverState['vehicleType']) => void;
  onResetShift: () => void;
}

export const ShiftTrackerModal: React.FC<ShiftTrackerModalProps> = ({
  isOpen,
  onClose,
  driverState,
  onUpdateVehicleType,
  onResetShift
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono">Driver Shift & Surge Performance</h2>
              <p className="text-[11px] text-slate-400">Real-time revenue metrics vs empty cruise reduction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shift Metrics Grid */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] uppercase font-mono text-slate-400">Today's Net Revenue</div>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                ${driverState.todayEarnings.toFixed(2)}
              </div>
              <div className="text-[11px] text-emerald-300 font-mono mt-0.5">
                {driverState.tripsCompleted} Completed Trips
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] uppercase font-mono text-slate-400">Pre-Surge Premium Captured</div>
              <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                +${driverState.surgeBonusCaptured.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                +38% vs normal off-peak fare
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] uppercase font-mono text-slate-400">Empty Cruising Time Saved</div>
              <div className="text-2xl font-black font-mono text-cyan-400 mt-1">
                {driverState.idleReductionMins} mins
              </div>
              <div className="text-[11px] text-cyan-300 font-mono mt-0.5">
                Less unpaid fuel & battery burn
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] uppercase font-mono text-slate-400">Pre-Surge Hit Rate</div>
              <div className="text-2xl font-black font-mono text-rose-400 mt-1">
                92.4%
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                Arrived before algorithm lock
              </div>
            </div>
          </div>

          {/* Vehicle Category Selector */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vehicle Classification (Adjusts Multipliers):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['4-Seater', '6-Seater', 'Electric PHV', 'Taxi'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => onUpdateVehicleType(v)}
                  className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                    driverState.vehicleType === v
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-md font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Platform Strategy Breakdown */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="font-bold text-slate-300">Singapore Platform Strategy Breakdown:</div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold text-white">Tada:</span>
                <span>0% Commission • Best for concert & stadium flat fares</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold text-white">Grab:</span>
                <span>20% Commission • Highest volume during sudden monsoon rain</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold text-white">Gojek:</span>
                <span>15% Commission • Strong downtown & CBD cross-island demand</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold text-white">Metered Taxi:</span>
                <span>No platform cut • Highest margin on Changi Airport (+$8 surcharge)</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={onResetShift}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-semibold border border-slate-700"
            >
              Reset Shift Data
            </button>
            <button
              onClick={onClose}
              className="py-2 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md"
            >
              Close HUD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
