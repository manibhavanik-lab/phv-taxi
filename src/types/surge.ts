export type Sector = 'Central' | 'East' | 'West' | 'North' | 'North-East';

export type CatalystType = 
  | 'weather' 
  | 'mrt_disruption' 
  | 'flight_wave' 
  | 'concert_egress' 
  | 'traffic_gridlock' 
  | 'nightlife_rush';

export interface PreSurgeOpportunity {
  id: string;
  title: string;
  zoneName: string;
  sector: Sector;
  coordinates: [number, number]; // [lat, lng]
  currentMultiplier: number;     // e.g. 1.0 (no surge yet in public app!)
  predictedMultiplier: number;   // e.g. 2.4x
  estimatedFareBoost: string;    // e.g. "+$18 - $28"
  expectedNetHourly: number;     // e.g. $74/hr
  timeToPublicSurgeMinutes: number; // e.g. 6 mins until Grab/Gojek dynamic pricing locks out incoming drivers
  driverEtaMinutes: number;      // e.g. 7 mins
  windowRemainingMinutes: number;// e.g. 14 mins
  confidenceScore: number;       // 0 - 100
  catalystType: CatalystType;
  catalystDescription: string;
  mcpEvidence: Array<{
    tool: string;
    metric: string;
    value: string;
    signal: 'critical' | 'high' | 'moderate';
  }>;
  recommendedAction: string;
  recommendedRoute: string;
  affectedPlatforms: ('Grab' | 'Gojek' | 'Tada' | 'Taxi')[];
  activeCommutersWaiting: number;
  availableDriversNearby: number;
  supplyDemandRatio: number; // < 0.3 means acute shortage
  priority: 'URGENT' | 'HIGH' | 'TACTICAL';
}

export interface SingaporeZone {
  id: string;
  name: string;
  sector: Sector;
  coordinates: [number, number];
  landmarks: string[];
}

export interface MCPToolDef {
  name: string;
  description: string;
  parameters: Record<string, string>;
  sourceApi: string;
  refreshRate: string;
  status: 'ONLINE' | 'ACTIVE_POLL' | 'STREAMING';
}

export interface MCPToolLog {
  id: string;
  timestamp: string;
  toolName: string;
  inputParams: Record<string, any>;
  outputSummary: string;
  fullData: any;
  executionTimeMs: number;
  status: 'success' | 'running' | 'error';
}

export interface WeatherRadarCell {
  id: string;
  sector: Sector;
  lat: number;
  lng: number;
  radiusKm: number;
  intensityMmHr: number;
  stormType: 'Heavy Monsoon' | 'Thundery Showers' | 'Moderate Rain' | 'Passing Shower';
  movementHeading: string;
  estimatedArrivalMins: number;
  surgeProbability: number;
}

export interface LTAIncident {
  id: string;
  type: 'mrt_breakdown' | 'expressway_accident' | 'heavy_congestion' | 'tunnel_closure';
  location: string;
  sector: Sector;
  lat: number;
  lng: number;
  description: string;
  affectedLanesOrLine: string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'MODERATE';
  strandedCommutersEst: number;
}

export interface ChangiArrivalWave {
  terminal: 'T1' | 'T2' | 'T3' | 'T4' | 'Jewel';
  lat: number;
  lng: number;
  flightsNext30Mins: number;
  widebodyCount: number;
  incomingPax30Mins: number;
  taxiStandQueuePax: number;
  averageWaitTimeMins: number;
  airportSurcharge: number; // e.g. $8 or $6
  preSurgeRating: number;
}

export interface EventEgress {
  id: string;
  venue: string;
  eventName: string;
  sector: Sector;
  lat: number;
  lng: number;
  attendeesTotal: number;
  status: 'egress_starting' | 'peak_egress' | 'doors_closing' | 'upcoming_in_30m';
  minutesUntilPeakEgress: number;
  estimatedRideHailingDemand: number;
  suggestedStagingZone: string;
}

export interface DriverState {
  currentLocationName: string;
  sector: Sector;
  lat: number;
  lng: number;
  platform: 'Grab' | 'Gojek' | 'Tada' | 'Taxi' | 'All';
  vehicleType: '4-Seater' | '6-Seater' | 'Electric PHV' | 'Taxi';
  todayEarnings: number;
  tripsCompleted: number;
  surgeBonusCaptured: number;
  idleReductionMins: number;
  voiceHUDEnabled: boolean;
  audioDispatchVolume: number;
}

export interface CopilotIntelResponse {
  briefingHeadline: string;
  strategicSummary: string;
  tacticalAdvice: string[];
  topOpportunityId: string;
  preSurgeWindowMinutes: number;
  mcpSignalsProcessed: number;
  threatsToAvoid: string[];
  projectedEarningsBoost: string;
  timestamp: string;
}

export interface MCPSpatialMapDisplayResponse {
  server: {
    name: string;
    protocol: string;
    version: string;
    status: 'ONLINE' | 'STREAMING' | 'DEGRADED';
    lastUpdated: string;
    refreshIntervalMs: number;
    latencyMs: number;
  };
  spatialBoundingBox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  features: {
    surgeHotspots: PreSurgeOpportunity[];
    weatherCells: WeatherRadarCell[];
    ltaIncidents: LTAIncident[];
    flightWaves: ChangiArrivalWave[];
    eventEgresses: EventEgress[];
    zones: SingaporeZone[];
    activeSpeedBands: Array<{
      road: string;
      speedKmh: number;
      congestionLevel: 'GREEN' | 'AMBER' | 'RED';
      startCoord: [number, number];
      endCoord: [number, number];
    }>;
  };
  activeFilters: {
    sector: string;
    layers: string[];
  };
  driverTelemetry: {
    driverLocation: string;
    coordinates: [number, number];
  };
  tacticalSummary: string;
}
