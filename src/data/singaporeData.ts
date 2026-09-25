import { PreSurgeOpportunity, SingaporeZone, WeatherRadarCell, LTAIncident, ChangiArrivalWave, EventEgress, MCPToolDef } from '../types/surge';

export const SINGAPORE_ZONES: SingaporeZone[] = [
  { id: 'central_cbd', name: 'Raffles Place / Marina Bay', sector: 'Central', coordinates: [1.2838, 103.8516], landmarks: ['Marina Bay Financial Centre', 'One Raffles Quay', 'Lau Pa Sat'] },
  { id: 'central_orchard', name: 'Orchard Road / Somerset', sector: 'Central', coordinates: [1.3048, 103.8318], landmarks: ['ION Orchard', 'Takashimaya', 'Paragon'] },
  { id: 'central_novena', name: 'Novena / Newton', sector: 'Central', coordinates: [1.3204, 103.8438], landmarks: ['Tan Tock Seng Hospital', 'Novena Square', 'Newton Food Centre'] },
  { id: 'central_kallang', name: 'Kallang / Sports Hub', sector: 'Central', coordinates: [1.3032, 103.8748], landmarks: ['Singapore National Stadium', 'Indoor Stadium', 'Kallang Wave Mall'] },
  { id: 'east_changi', name: 'Changi Airport T1-T4', sector: 'East', coordinates: [1.3644, 103.9915], landmarks: ['Jewel Changi', 'Terminal 3 Arrivals', 'Terminal 1 Taxi Bay'] },
  { id: 'east_tampines', name: 'Tampines Regional Hub', sector: 'East', coordinates: [1.3532, 103.9452], landmarks: ['Our Tampines Hub', 'Tampines Mall', 'Century Square'] },
  { id: 'east_expo', name: 'Singapore EXPO / Changi City', sector: 'East', coordinates: [1.3345, 103.9615], landmarks: ['Expo Halls 1-6', 'Changi City Point', 'SUTD'] },
  { id: 'west_jurong', name: 'Jurong East Central', sector: 'West', coordinates: [1.3331, 103.7436], landmarks: ['Jem', 'Westgate', 'Jurong East Bus Interchange'] },
  { id: 'west_buonavista', name: 'Buona Vista / One-North', sector: 'West', coordinates: [1.3072, 103.7901], landmarks: ['The Star Vista', 'Biopolis', 'Fusionopolis'] },
  { id: 'north_woodlands', name: 'Woodlands Civic / Checkpoint', sector: 'North', coordinates: [1.4382, 103.7890], landmarks: ['Causeway Point', 'Woodlands Checkpoint', 'Civic Centre'] },
  { id: 'northeast_punggol', name: 'Punggol Waterway / Digital', sector: 'North-East', coordinates: [1.4052, 103.9023], landmarks: ['Waterway Point', 'Punggol Coast', 'Oasis Terraces'] },
  { id: 'central_sentosa', name: 'Sentosa / HarbourFront', sector: 'Central', coordinates: [1.2585, 103.8200], landmarks: ['VivoCity', 'Resorts World Sentosa', 'Siloso Beach'] }
];

export const REGISTERED_MCP_TOOLS: MCPToolDef[] = [
  {
    name: 'mcp_singapore_weather_radar',
    description: 'Queries MSS (Meteorological Service Singapore) 5-minute Doppler radar reflectivity, rain cell vector, and precipitation mm/hr per sector.',
    parameters: { sector: 'Central | East | West | North | North-East', minIntensityMm: 'number' },
    sourceApi: 'weather.gov.sg / MSS Doppler Real-time Stream',
    refreshRate: 'Every 30s',
    status: 'STREAMING'
  },
  {
    name: 'mcp_lta_traffic_incidents',
    description: 'Pulls Land Transport Authority (LTA) DataMall EMAS live incident stream (expressway collisions, road closures, and SMRT/SBS MRT service disruptions).',
    parameters: { expressway: 'string (PIE, CTE, AYE, ECP, KPE)', severityFilter: 'CRITICAL | ALL' },
    sourceApi: 'LTA DataMall v2 EMAS & Rail Alert Feed',
    refreshRate: 'Every 15s',
    status: 'ONLINE'
  },
  {
    name: 'mcp_changi_airport_ops',
    description: 'Tracks Changi Airport Group (CAG) widebody inbound flight waves, passenger clearance times, and taxi bay passenger queue count.',
    parameters: { terminal: 'T1 | T2 | T3 | T4', timeWindowMins: '30' },
    sourceApi: 'Changi Airport Flight Ingestion Engine',
    refreshRate: 'Every 60s',
    status: 'ACTIVE_POLL'
  },
  {
    name: 'mcp_entertainment_event_egress',
    description: 'Monitors Singapore Sports Hub, Singapore Expo, MBS, and Clarke Quay event schedules, crowd egress countdowns, and ride-hailing demand spikes.',
    parameters: { venueId: 'string', minAttendees: 'number' },
    sourceApi: 'Singapore Event Operations & Venue Sensor Feed',
    refreshRate: 'Every 45s',
    status: 'ONLINE'
  },
  {
    name: 'mcp_spatial_travel_matrix',
    description: 'Calculates high-precision driver travel duration (ETA), avoids bottlenecks/ERP gantries, and computes Pre-Surge Opportunity Score (PSOS).',
    parameters: { originCoords: '[lat, lng]', destinationZone: 'string', trafficAdjusted: 'boolean' },
    sourceApi: 'OneMap / LTA Speed Bands Matrix Engine',
    refreshRate: 'Real-time',
    status: 'ONLINE'
  },
  {
    name: 'mcp_phv_fare_estimator',
    description: 'Forecasts Grab, Gojek, Tada, and Metered Taxi surge multiplier, fare delta ($ boost), and optimal pickup staging coordinate before public surge lock.',
    parameters: { zone: 'string', currentDemandPax: 'number', supplyCabs: 'number' },
    sourceApi: 'Ride-Hailing Dynamic Pricing Predictive Model',
    refreshRate: 'Real-time',
    status: 'ONLINE'
  },
  {
    name: 'mcp_spatial_map_display',
    description: 'Serves real-time vector GeoJSON layers, live traffic speed bands, rain radar precipitation contours, LTA incident beacons, and pre-surge heat polygons for tactical spatial display rendering.',
    parameters: {
      sectorFilter: 'All | Central | East | West | North | North-East',
      layerTypes: '["surge", "weather", "incidents", "routes"]',
      driverCoordinates: '[lat, lng]'
    },
    sourceApi: 'MCP Spatial Map Protocol Server & OneMap / LTA Geo DataMall',
    refreshRate: '10s Streaming Poll',
    status: 'STREAMING'
  }
];

export const INITIAL_WEATHER_RADAR: WeatherRadarCell[] = [
  {
    id: 'rain_cbd',
    sector: 'Central',
    lat: 1.2850,
    lng: 103.8500,
    radiusKm: 2.8,
    intensityMmHr: 68.4,
    stormType: 'Heavy Monsoon',
    movementHeading: 'SSE at 18 km/h',
    estimatedArrivalMins: 4,
    surgeProbability: 96
  },
  {
    id: 'rain_orchard',
    sector: 'Central',
    lat: 1.3060,
    lng: 103.8320,
    radiusKm: 2.1,
    intensityMmHr: 52.0,
    stormType: 'Thundery Showers',
    movementHeading: 'SE at 14 km/h',
    estimatedArrivalMins: 8,
    surgeProbability: 88
  },
  {
    id: 'rain_jurong',
    sector: 'West',
    lat: 1.3400,
    lng: 103.7400,
    radiusKm: 3.5,
    intensityMmHr: 44.2,
    stormType: 'Thundery Showers',
    movementHeading: 'E at 22 km/h',
    estimatedArrivalMins: 15,
    surgeProbability: 82
  }
];

export const INITIAL_LTA_INCIDENTS: LTAIncident[] = [
  {
    id: 'inc_mrt_buonavista',
    type: 'mrt_breakdown',
    location: 'Buona Vista MRT Interchange (East-West Line)',
    sector: 'West',
    lat: 1.3072,
    lng: 103.7901,
    description: 'Signal track fault between Queenstown and Buona Vista. Free bridging bus activated. Platform crowded with 3,900+ stranded commuters.',
    affectedLanesOrLine: 'EWL (Boon Lay bound delayed by 28 mins)',
    timestamp: 'Just now (4 mins ago)',
    severity: 'CRITICAL',
    strandedCommutersEst: 3950
  },
  {
    id: 'inc_pie_adam',
    type: 'expressway_accident',
    location: 'PIE (towards Changi) before Adam Road exit',
    sector: 'Central',
    lat: 1.3312,
    lng: 103.8180,
    description: 'Multi-vehicle collision blocking Lane 1 and 2. Congestion tail back to Lornie Highway. PHVs avoiding expressway via Dunearn Rd.',
    affectedLanesOrLine: 'Lanes 1 & 2 closed',
    timestamp: '12 mins ago',
    severity: 'WARNING',
    strandedCommutersEst: 320
  },
  {
    id: 'inc_cte_moulmein',
    type: 'heavy_congestion',
    location: 'CTE (towards City) after Moulmein Road',
    sector: 'Central',
    lat: 1.3190,
    lng: 103.8540,
    description: 'Heavy traffic volume leading into Marina Coastal Expressway / CBD. Average vehicle speed 14 km/h.',
    affectedLanesOrLine: 'All lanes slow moving',
    timestamp: '8 mins ago',
    severity: 'MODERATE',
    strandedCommutersEst: 150
  }
];

export const INITIAL_CHANGI_ARRIVALS: ChangiArrivalWave[] = [
  {
    terminal: 'T3',
    lat: 1.3556,
    lng: 103.9870,
    flightsNext30Mins: 5,
    widebodyCount: 4, // SQ317 (A380 London), NH841 (B787 Tokyo), SQ637 (A350 Narita), BA11 (A380 LHR)
    incomingPax30Mins: 1820,
    taxiStandQueuePax: 260,
    averageWaitTimeMins: 22,
    airportSurcharge: 8.0,
    preSurgeRating: 95
  },
  {
    terminal: 'T1',
    lat: 1.3620,
    lng: 103.9900,
    flightsNext30Mins: 3,
    widebodyCount: 2,
    incomingPax30Mins: 890,
    taxiStandQueuePax: 110,
    averageWaitTimeMins: 12,
    airportSurcharge: 8.0,
    preSurgeRating: 84
  },
  {
    terminal: 'T4',
    lat: 1.3385,
    lng: 103.9830,
    flightsNext30Mins: 4,
    widebodyCount: 1, // AirAsia, VietJet, Cathay
    incomingPax30Mins: 720,
    taxiStandQueuePax: 75,
    averageWaitTimeMins: 9,
    airportSurcharge: 6.0,
    preSurgeRating: 72
  }
];

export const INITIAL_EVENT_EGRESS: EventEgress[] = [
  {
    id: 'evt_national_stadium',
    venue: 'Singapore National Stadium (Kallang)',
    eventName: 'Major World Tour Concert (55,000 Capacity)',
    sector: 'Central',
    lat: 1.3032,
    lng: 103.8748,
    attendeesTotal: 54200,
    status: 'egress_starting',
    minutesUntilPeakEgress: 9,
    estimatedRideHailingDemand: 7400,
    suggestedStagingZone: 'Old Airport Road food centre / Pine Close taxi drop'
  },
  {
    id: 'evt_mbs_nightlife',
    venue: 'Marina Bay Sands (Marquee & Casino North Gate)',
    eventName: 'VIP Nightlife & High-Roller Egress',
    sector: 'Central',
    lat: 1.2830,
    lng: 103.8600,
    attendeesTotal: 4200,
    status: 'peak_egress',
    minutesUntilPeakEgress: 0,
    estimatedRideHailingDemand: 1650,
    suggestedStagingZone: 'Sheares Link slipway or Bayfront Ave basement taxi bay'
  },
  {
    id: 'evt_singapore_expo',
    venue: 'Singapore EXPO Hall 4 & 5',
    eventName: 'Asia-Pacific FinTech & Tech Convention',
    sector: 'East',
    lat: 1.3345,
    lng: 103.9615,
    attendeesTotal: 14500,
    status: 'upcoming_in_30m',
    minutesUntilPeakEgress: 24,
    estimatedRideHailingDemand: 2800,
    suggestedStagingZone: 'Somapah Road pickup shelter or Expo Drive Gate 2'
  }
];

export const INITIAL_PRE_SURGE_OPPORTUNITIES: PreSurgeOpportunity[] = [
  {
    id: 'opp_kallang_concert',
    title: 'National Stadium Concert Finale Egress Wave',
    zoneName: 'Kallang Sports Hub / Stadium Way',
    sector: 'Central',
    coordinates: [1.3032, 103.8748],
    currentMultiplier: 1.0, // Normal public fare right now!
    predictedMultiplier: 2.8,
    estimatedFareBoost: '+$24 - $38',
    expectedNetHourly: 88,
    timeToPublicSurgeMinutes: 7,
    driverEtaMinutes: 8,
    windowRemainingMinutes: 14,
    confidenceScore: 97,
    catalystType: 'concert_egress',
    catalystDescription: 'Encore playing now. 54,000 concert-goers exiting Stadium Walk in 9 mins. MRT Stadium station will bottleneck instantly.',
    mcpEvidence: [
      { tool: 'mcp_entertainment_event_egress', metric: 'Crowd Release Vector', value: '54,200 attendees egressing', signal: 'critical' },
      { tool: 'mcp_spatial_travel_matrix', metric: 'Nicoll Hwy Capacity', value: '78% full, closing soon', signal: 'high' },
      { tool: 'mcp_phv_fare_estimator', metric: 'Predicted Grab/Gojek Surge', value: '2.8x ($46 avg fare)', signal: 'critical' }
    ],
    recommendedAction: 'Position at Old Airport Road / Mountbatten Rd immediately to pick up walking riders before Stadium Way gridlock locks all exits.',
    recommendedRoute: 'Via Nicoll Highway take Guillemard exit to avoid front gate congestion.',
    affectedPlatforms: ['Grab', 'Gojek', 'Tada', 'Taxi'],
    activeCommutersWaiting: 4200,
    availableDriversNearby: 48,
    supplyDemandRatio: 0.11,
    priority: 'URGENT'
  },
  {
    id: 'opp_buonavista_mrt',
    title: 'SMRT East-West Line Breakdown Spillover',
    zoneName: 'Buona Vista / The Star Vista',
    sector: 'West',
    coordinates: [1.3072, 103.7901],
    currentMultiplier: 1.1,
    predictedMultiplier: 2.4,
    estimatedFareBoost: '+$18 - $28',
    expectedNetHourly: 76,
    timeToPublicSurgeMinutes: 5,
    driverEtaMinutes: 6,
    windowRemainingMinutes: 18,
    confidenceScore: 94,
    catalystType: 'mrt_disruption',
    catalystDescription: 'SMRT EWL signal fault between Queenstown and Buona Vista. Bridging buses overwhelmed. Taxi stand has 180+ pax queue.',
    mcpEvidence: [
      { tool: 'mcp_lta_traffic_incidents', metric: 'LTA Rail Disruption Alert', value: 'EWL fault, Queenstown-BV down', signal: 'critical' },
      { tool: 'mcp_phv_fare_estimator', metric: 'Unmet Demand Volume', value: '3,950 stranded pax', signal: 'critical' },
      { tool: 'mcp_spatial_travel_matrix', metric: 'Local Fleet Density', value: 'Only 32 available cabs in 2km', signal: 'high' }
    ],
    recommendedAction: 'Stage at Rochester Mall slipway or Star Vista B1 pickup. High volume of corporate executives heading to Jurong or Tanjong Pagar.',
    recommendedRoute: 'Via Holland Road -> North Buona Vista Road bypass.',
    affectedPlatforms: ['Grab', 'Gojek', 'Tada', 'Taxi'],
    activeCommutersWaiting: 2800,
    availableDriversNearby: 32,
    supplyDemandRatio: 0.14,
    priority: 'URGENT'
  },
  {
    id: 'opp_changi_t3_widebody',
    title: 'Changi T3 Inbound Flight Quad-Wave',
    zoneName: 'Changi Airport Terminal 3',
    sector: 'East',
    coordinates: [1.3556, 103.9870],
    currentMultiplier: 1.0,
    predictedMultiplier: 2.2,
    estimatedFareBoost: '+$22 - $34 (incl. $8 surcharge)',
    expectedNetHourly: 82,
    timeToPublicSurgeMinutes: 11,
    driverEtaMinutes: 12,
    windowRemainingMinutes: 28,
    confidenceScore: 91,
    catalystType: 'flight_wave',
    catalystDescription: '4 widebody flights (SQ317 London, NH841 Tokyo, SQ637, BA11) touching down in 15 mins. 1,820 long-haul passengers with heavy luggage.',
    mcpEvidence: [
      { tool: 'mcp_changi_airport_ops', metric: 'CAG Flight Ingestion', value: '4 widebodies, 1,820 pax arriving', signal: 'critical' },
      { tool: 'mcp_changi_airport_ops', metric: 'Taxi Stand Buffer', value: 'Queue +260 pax, 18 cabs on lot', signal: 'critical' },
      { tool: 'mcp_phv_fare_estimator', metric: 'Airport Peak Surcharge', value: '+$8.00 statutory surcharge', signal: 'high' }
    ],
    recommendedAction: 'Enter T3 Arrival pick-up level or taxi holding area now. Zero waiting time upon arrival; quick turnaround to city center / MBS.',
    recommendedRoute: 'Via ECP take Airport Boulevard Exit 1 directly into T3 basement.',
    affectedPlatforms: ['Grab', 'Gojek', 'Tada', 'Taxi'],
    activeCommutersWaiting: 1450,
    availableDriversNearby: 42,
    supplyDemandRatio: 0.22,
    priority: 'HIGH'
  },
  {
    id: 'opp_cbd_monsoon',
    title: 'Marina Bay / Raffles Place Sudden Torrential Rain',
    zoneName: 'Raffles Place / Marina Financial Centre',
    sector: 'Central',
    coordinates: [1.2838, 103.8516],
    currentMultiplier: 1.0,
    predictedMultiplier: 2.3,
    estimatedFareBoost: '+$16 - $25',
    expectedNetHourly: 72,
    timeToPublicSurgeMinutes: 6,
    driverEtaMinutes: 7,
    windowRemainingMinutes: 16,
    confidenceScore: 92,
    catalystType: 'weather',
    catalystDescription: 'Doppler radar shows 68.4 mm/hr intense cloudburst hitting downtown. Commuters cannot walk sheltered to MRT; app orders spiking 420%.',
    mcpEvidence: [
      { tool: 'mcp_singapore_weather_radar', metric: 'Doppler Radar Reflectivity', value: '68.4 mm/hr Monsoon cell', signal: 'critical' },
      { tool: 'mcp_spatial_travel_matrix', metric: 'Walking Distance Deterrence', value: 'Outdoor walking -85%', signal: 'high' },
      { tool: 'mcp_phv_fare_estimator', metric: 'Demand Acceleration', value: '+420% app openings', signal: 'critical' }
    ],
    recommendedAction: 'Head to One Raffles Quay or Marina Bay Link Mall sheltered drop-off zones. Target CBD to Bukit Timah / East Coast commuters.',
    recommendedRoute: 'Via Shenton Way or Robinson Road avoiding Collyer Quay pooling.',
    affectedPlatforms: ['Grab', 'Gojek', 'Tada', 'Taxi'],
    activeCommutersWaiting: 3100,
    availableDriversNearby: 58,
    supplyDemandRatio: 0.18,
    priority: 'HIGH'
  },
  {
    id: 'opp_mbs_nightlife',
    title: 'Marina Bay Sands / Marquee Closing Rush',
    zoneName: 'Marina Bay Sands & Bayfront',
    sector: 'Central',
    coordinates: [1.2830, 103.8600],
    currentMultiplier: 1.2,
    predictedMultiplier: 2.5,
    estimatedFareBoost: '+$20 - $32',
    expectedNetHourly: 84,
    timeToPublicSurgeMinutes: 8,
    driverEtaMinutes: 9,
    windowRemainingMinutes: 20,
    confidenceScore: 89,
    catalystType: 'nightlife_rush',
    catalystDescription: 'Marquee VIP closing & Casino shift change. High density of tourists and party-goers willing to pay premium 6-seater / PHV fares.',
    mcpEvidence: [
      { tool: 'mcp_entertainment_event_egress', metric: 'Venue Sensor', value: 'Marquee & Ce La Vi closing', signal: 'critical' },
      { tool: 'mcp_phv_fare_estimator', metric: 'Premium Vehicle Demand', value: '6-Seater / Premium ratio 48%', signal: 'high' }
    ],
    recommendedAction: 'Stage near Bayfront Avenue or Sands Expo & Convention Centre basement.',
    recommendedRoute: 'Via Marina Boulevard into Bayfront Avenue slipway.',
    affectedPlatforms: ['Grab', 'Gojek', 'Tada', 'Taxi'],
    activeCommutersWaiting: 1650,
    availableDriversNearby: 28,
    supplyDemandRatio: 0.17,
    priority: 'TACTICAL'
  }
];
