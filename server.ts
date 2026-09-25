import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  REGISTERED_MCP_TOOLS,
  INITIAL_PRE_SURGE_OPPORTUNITIES,
  INITIAL_WEATHER_RADAR,
  INITIAL_LTA_INCIDENTS,
  INITIAL_CHANGI_ARRIVALS,
  INITIAL_EVENT_EGRESS,
  SINGAPORE_ZONES
} from './src/data/singaporeData.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize GoogleGenAI SDK with required telemetry User-Agent
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory mutable state for dynamic simulator adjustments
let activeOpportunities = [...INITIAL_PRE_SURGE_OPPORTUNITIES];
let activeWeather = [...INITIAL_WEATHER_RADAR];
let activeIncidents = [...INITIAL_LTA_INCIDENTS];
let activeArrivals = [...INITIAL_CHANGI_ARRIVALS];
let activeEvents = [...INITIAL_EVENT_EGRESS];

// API: Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!apiKey,
    mcpToolsCount: REGISTERED_MCP_TOOLS.length,
    activeOpportunitiesCount: activeOpportunities.length,
    timestamp: new Date().toISOString()
  });
});

// API: Get Registered MCP Tools
app.get('/api/mcp/tools', (req: Request, res: Response) => {
  res.json({
    protocol: 'Model Context Protocol (MCP) v1.0',
    serverName: 'SurgeSG-Fleet-Intelligence-Host',
    tools: REGISTERED_MCP_TOOLS,
    timestamp: new Date().toISOString()
  });
});

// API: Get Pre-Surge Opportunities
app.get('/api/pre-surge/opportunities', (req: Request, res: Response) => {
  res.json({
    opportunities: activeOpportunities,
    weatherCells: activeWeather,
    ltaIncidents: activeIncidents,
    flightWaves: activeArrivals,
    eventEgresses: activeEvents,
    zones: SINGAPORE_ZONES,
    timestamp: new Date().toISOString()
  });
});

// MCP Server: Spatial Map Display Protocol Endpoint (serves integrated layers, vector features, speed bands)
app.get('/api/mcp/spatial-map-display', (req: Request, res: Response) => {
  const startTime = Date.now();
  const sector = (req.query.sector as string) || 'All';
  const driverLat = parseFloat((req.query.lat as string) || '1.3204');
  const driverLng = parseFloat((req.query.lng as string) || '103.8438');
  const driverLocation = (req.query.location as string) || 'Novena / Newton';

  // Filter features according to sector if specified
  const filteredHotspots = sector === 'All' 
    ? activeOpportunities 
    : activeOpportunities.filter(o => o.sector === sector);

  const filteredWeather = sector === 'All'
    ? activeWeather
    : activeWeather.filter(w => w.sector === sector);

  const filteredIncidents = sector === 'All'
    ? activeIncidents
    : activeIncidents.filter(i => i.sector === sector);

  // Speed bands for arterial corridors and expressways (OneMap / LTA Traffic Speed Bands)
  const activeSpeedBands = [
    {
      road: 'Nicoll Highway (City bound)',
      speedKmh: 48,
      congestionLevel: 'GREEN' as const,
      startCoord: [1.2980, 103.8640] as [number, number],
      endCoord: [1.2930, 103.8560] as [number, number]
    },
    {
      road: 'Stadium Way (Concert bottleneck)',
      speedKmh: 8,
      congestionLevel: 'RED' as const,
      startCoord: [1.3040, 103.8760] as [number, number],
      endCoord: [1.3010, 103.8720] as [number, number]
    },
    {
      road: 'CTE Southbound (Moulmein -> Outram)',
      speedKmh: 14,
      congestionLevel: 'RED' as const,
      startCoord: [1.3200, 103.8530] as [number, number],
      endCoord: [1.2950, 103.8420] as [number, number]
    },
    {
      road: 'ECP Airport Corridor (T3 -> Marina)',
      speedKmh: 76,
      congestionLevel: 'GREEN' as const,
      startCoord: [1.3500, 103.9700] as [number, number],
      endCoord: [1.3050, 103.8800] as [number, number]
    },
    {
      road: 'PIE Westbound (Adam -> Jurong)',
      speedKmh: 32,
      congestionLevel: 'AMBER' as const,
      startCoord: [1.3320, 103.8180] as [number, number],
      endCoord: [1.3400, 103.7500] as [number, number]
    }
  ];

  const latencyMs = Date.now() - startTime;

  res.json({
    server: {
      name: 'mcp-spatial-map-server-singapore',
      protocol: 'Model Context Protocol (MCP) Spatial Vector v1.0',
      version: '1.4.2-sg-prod',
      status: 'STREAMING',
      lastUpdated: new Date().toISOString(),
      refreshIntervalMs: 10000,
      latencyMs: Math.max(8, latencyMs)
    },
    spatialBoundingBox: {
      minLat: 1.2200,
      maxLat: 1.4700,
      minLng: 103.6000,
      maxLng: 104.0400
    },
    features: {
      surgeHotspots: filteredHotspots,
      weatherCells: filteredWeather,
      ltaIncidents: filteredIncidents,
      flightWaves: activeArrivals,
      eventEgresses: activeEvents,
      zones: SINGAPORE_ZONES,
      activeSpeedBands
    },
    activeFilters: {
      sector,
      layers: ['surge', 'weather', 'incidents', 'flights', 'speed_bands', 'routes']
    },
    driverTelemetry: {
      driverLocation,
      coordinates: [driverLat, driverLng]
    },
    tacticalSummary: `MCP Map Server actively serving ${filteredHotspots.length} surge polygons, ${filteredWeather.length} Doppler radar contours, and ${activeSpeedBands.length} live LTA speed corridors.`
  });
});

// MCP Server: Spatial Tile Stream Proxy Endpoint
// Proxies high-speed raster & vector map tiles via the Singapore Spatial MCP Tile Gateway, removing CartoDB dependency
app.get('/api/mcp/spatial-tiles/:theme/:z/:x/:y.png', (req: Request, res: Response) => {
  const { theme, z, x, y } = req.params;

  // Select upstream open spatial tile provider with tactical high contrast for PHV drivers
  // 'night' => Stadia/Alidade Smooth Dark or CARTO replacement via OSM/CyclOSM/Stadia
  // 'day' => OpenStreetMap Standard / Humanitarian Vector
  let upstreamTileUrl = '';
  if (theme === 'night') {
    upstreamTileUrl = `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/${z}/${x}/${y}.png`;
  } else {
    upstreamTileUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  }

  // Fallback to OpenStreetMap Standard if sub-resource fails
  res.redirect(upstreamTileUrl);
});

// API: Execute specific MCP Tool Call
app.post('/api/mcp/invoke', (req: Request, res: Response) => {
  const { toolName, parameters } = req.body;
  const startTime = Date.now();

  try {
    let resultData: any = null;
    let summary = '';

    switch (toolName) {
      case 'mcp_singapore_weather_radar': {
        const sector = parameters?.sector || 'Central';
        const matchingCells = activeWeather.filter(c => !sector || c.sector === sector);
        resultData = {
          cells: matchingCells,
          monsoonAlertLevel: 'CAT_1_ALERT',
          sectorPrecipitationForecastMmHr: matchingCells.reduce((acc, c) => Math.max(acc, c.intensityMmHr), 0),
          windDirection: '340 deg (North-North-West)',
          groundSurfaceTraction: 'WET_SLIPPERY'
        };
        summary = `Detected ${matchingCells.length} intense rain cells in ${sector}. Max rain rate ${resultData.sectorPrecipitationForecastMmHr} mm/hr. Commuter demand expected to surge 380% in 5-8 mins.`;
        break;
      }

      case 'mcp_lta_traffic_incidents': {
        resultData = {
          incidents: activeIncidents,
          criticalRailDisruptions: activeIncidents.filter(i => i.type === 'mrt_breakdown'),
          expresswayAccidents: activeIncidents.filter(i => i.type === 'expressway_accident'),
          totalStrandedCommutersEst: activeIncidents.reduce((sum, i) => sum + i.strandedCommutersEst, 0)
        };
        summary = `LTA EMAS stream shows ${activeIncidents.length} active alerts. Critical: EWL Buona Vista breakdown with ~3,950 stranded pax seeking ride-hail.`;
        break;
      }

      case 'mcp_changi_airport_ops': {
        resultData = {
          terminals: activeArrivals,
          next30MinsInboundPaxTotal: activeArrivals.reduce((sum, a) => sum + a.incomingPax30Mins, 0),
          highestDemandTerminal: 'T3',
          airportSurchargeEffective: 8.0,
          taxiHoldQueueShortagePercentage: 68
        };
        summary = `CAG radar: 4 widebody flights landing at T3 within 15 mins. Inbound pax: 1,820. Taxi stand queue +260 pax vs 18 cabs. $8 airport surcharge active.`;
        break;
      }

      case 'mcp_entertainment_event_egress': {
        resultData = {
          events: activeEvents,
          immediateEgressEvent: activeEvents.find(e => e.status === 'egress_starting') || activeEvents[0],
          totalPotentialPickups: activeEvents.reduce((sum, e) => sum + e.estimatedRideHailingDemand, 0)
        };
        summary = `National Stadium concert concert-goers releasing in 9 mins (54,200 attendees). Estimated 7,400 PHV requests will spike multiplier to 2.8x.`;
        break;
      }

      case 'mcp_spatial_travel_matrix': {
        const origin = parameters?.originCoords || [1.3204, 103.8438];
        const dest = parameters?.destinationZone || 'Kallang';
        resultData = {
          originCoords: origin,
          destination: dest,
          estimatedDurationMinutes: 8,
          distanceKm: 6.4,
          congestionIndex: 'MODERATE',
          recommendedCorridor: 'Nicoll Highway via Guillemard sliproad (bypasses Stadium Way bottleneck)',
          erpGantryChargesTotal: 2.0
        };
        summary = `Calculated optimal travel route to ${dest}: 8 mins ETA (6.4 km). Avoids Stadium Way main traffic choke. Arrival 5 mins BEFORE public surge pricing locks.`;
        break;
      }

      case 'mcp_phv_fare_estimator': {
        resultData = {
          zone: parameters?.zone || 'National Stadium Kallang',
          baseFare: 16.0,
          projectedMultiplier: 2.8,
          projectedGrossFare: 44.8,
          estimatedNetSurgeBonus: 28.8,
          competitorStatus: {
            Grab: 'Surge algorithm spooling up (3 mins to lock)',
            Gojek: 'Normal 1.0x (lagging by 4 mins)',
            Tada: 'Zero commission surge window active',
            MeteredTaxi: 'Peak + Location Surcharge +$11.00'
          }
        };
        summary = `Fare estimator predicts 2.8x multiplier ($44.80 gross trip) within 6 mins. Tada & Grab expected to pay highest driver net margin.`;
        break;
      }

      case 'mcp_spatial_map_display': {
        resultData = {
          server: 'mcp-spatial-map-server-singapore',
          protocol: 'MCP Spatial Vector v1.0',
          activeFeaturesCount: activeOpportunities.length + activeWeather.length + activeIncidents.length,
          speedBandsStream: '5 monitored expressway corridors active',
          frameRefreshMs: 10000
        };
        summary = `MCP Spatial Map Server rendered real-time vector display with ${activeOpportunities.length} pre-surge hotspots and Doppler radar contours.`;
        break;
      }

      default:
        resultData = { message: 'Tool executed successfully', parameters };
        summary = `Executed tool ${toolName} with parameters`;
    }

    const executionTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      toolName,
      executionTimeMs,
      summary,
      data: resultData,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      toolName,
      error: err.message || 'Error executing MCP tool',
      timestamp: new Date().toISOString()
    });
  }
});

// API: Trigger Simulator Scenario (e.g. Test Rain Storm, MRT Breakdown, Concert Egress)
app.post('/api/simulator/trigger-scenario', (req: Request, res: Response) => {
  const { scenarioId } = req.body;

  if (scenarioId === 'monsoon_orchard') {
    // Boost Orchard weather and opportunity
    const orchardIndex = activeOpportunities.findIndex(o => o.id === 'opp_cbd_monsoon');
    if (orchardIndex !== -1) {
      activeOpportunities[orchardIndex].predictedMultiplier = 3.1;
      activeOpportunities[orchardIndex].timeToPublicSurgeMinutes = 4;
      activeOpportunities[orchardIndex].estimatedFareBoost = '+$28 - $42';
      activeOpportunities[orchardIndex].priority = 'URGENT';
    }
  } else if (scenarioId === 'mrt_circle_line') {
    // Add an urgent disruption
    const newDisruption = {
      id: 'inc_circle_line_' + Date.now(),
      type: 'mrt_breakdown' as const,
      location: 'Serangoon MRT Interchange (Circle / North-East Line)',
      sector: 'Central' as const,
      lat: 1.3499,
      lng: 103.8736,
      description: 'Power trip between Serangoon and Bishan. Massive evening rush hour crowd spilling out to taxi stands along Upper Serangoon Rd.',
      affectedLanesOrLine: 'CCL & NEL transfer blocked',
      timestamp: 'Just now',
      severity: 'CRITICAL' as const,
      strandedCommutersEst: 5200
    };
    activeIncidents.unshift(newDisruption);

    activeOpportunities.unshift({
      id: 'opp_serangoon_breakdown',
      title: 'Serangoon MRT Dual-Line Power Trip Outage',
      zoneName: 'Serangoon Central / NEX Mall',
      sector: 'Central',
      coordinates: [1.3499, 103.8736],
      currentMultiplier: 1.0,
      predictedMultiplier: 2.7,
      estimatedFareBoost: '+$22 - $35',
      expectedNetHourly: 86,
      timeToPublicSurgeMinutes: 4,
      driverEtaMinutes: 5,
      windowRemainingMinutes: 15,
      confidenceScore: 98,
      catalystType: 'mrt_disruption',
      catalystDescription: 'Power trip at Serangoon MRT. Over 5,000 commuters stranded at NEX taxi stand and bus interchange.',
      mcpEvidence: [
        { tool: 'mcp_lta_traffic_incidents', metric: 'Rail Disruption Severity', value: 'Dual-line power fault at Serangoon', signal: 'critical' },
        { tool: 'mcp_phv_fare_estimator', metric: 'Stranded Passenger Volume', value: '5,200 pax at NEX exits', signal: 'critical' },
        { tool: 'mcp_spatial_travel_matrix', metric: 'Driver Pre-Position ETA', value: '5 mins via CTE or Braddell', signal: 'high' }
      ],
      recommendedAction: 'Stage at NEX Mall pick-up point B or Serangoon Ave 2 taxi bay. Fares heading North-East (Punggol/Sengkang) will pay high distance + surge.',
      recommendedRoute: 'Via Braddell Road avoiding Upper Serangoon main traffic light choke.',
      affectedPlatforms: ['Grab', 'Gojek', 'Tada', 'Taxi'],
      activeCommutersWaiting: 4100,
      availableDriversNearby: 24,
      supplyDemandRatio: 0.08,
      priority: 'URGENT'
    });
  } else if (scenarioId === 'reset') {
    activeOpportunities = [...INITIAL_PRE_SURGE_OPPORTUNITIES];
    activeWeather = [...INITIAL_WEATHER_RADAR];
    activeIncidents = [...INITIAL_LTA_INCIDENTS];
    activeArrivals = [...INITIAL_CHANGI_ARRIVALS];
    activeEvents = [...INITIAL_EVENT_EGRESS];
  }

  res.json({
    success: true,
    scenarioId,
    activeOpportunities,
    timestamp: new Date().toISOString()
  });
});

// API: AI Copilot Strategic Analysis (Gemini 3.8 Flash)
app.post('/api/copilot/intel', async (req: Request, res: Response) => {
  const { driverLocation, platform, currentEarnings, vehicleType } = req.body;

  const driverZone = driverLocation || 'Novena';
  const driverVehicle = vehicleType || '4-Seater';

  // If Gemini API is available, ask Gemini 3.8 Flash to synthesize MCP signals and provide professional tactical driver advice
  if (ai) {
    try {
      const prompt = `You are the Singapore PHV & Taxi Fleet Co-Pilot Intelligence Engine ("SurgeSG").
Your mission is to guide drivers to high-revenue pre-surge locations BEFORE ride-hailing algorithms (Grab, Gojek, Tada) trigger public surge pricing.

Driver Telemetry:
- Current Location: ${driverZone}
- Vehicle Category: ${driverVehicle}
- Preferred Platform: ${platform || 'All (Grab/Gojek/Tada/Taxi)'}
- Today's Earnings so far: $${currentEarnings || 85}

Real-time MCP Sensor Telemetry:
1. Weather Radar:
${JSON.stringify(activeWeather, null, 2)}

2. LTA Traffic & MRT Incident Feed:
${JSON.stringify(activeIncidents, null, 2)}

3. Changi Airport Flight Arrivals:
${JSON.stringify(activeArrivals, null, 2)}

4. Major Event Egress:
${JSON.stringify(activeEvents, null, 2)}

5. Candidate Pre-Surge Hotspots:
${JSON.stringify(activeOpportunities.map(o => ({
  id: o.id,
  title: o.title,
  zone: o.zoneName,
  currentMultiplier: o.currentMultiplier,
  predictedMultiplier: o.predictedMultiplier,
  timeToPublicSurgeMins: o.timeToPublicSurgeMinutes,
  driverEtaMins: o.driverEtaMinutes,
  confidence: o.confidenceScore,
  catalyst: o.catalystDescription
})), null, 2)}

Analyze this data and return a JSON object with:
- "briefingHeadline": A crisp, tactical alert headline for the driver's heads-up display.
- "strategicSummary": 2-3 sentences explaining exactly why this pre-surge window is opening and where to position. Use authentic Singapore road & transport terminology (e.g., PIE, CTE, Nicoll Highway, EWL, slipway, taxi stand, ERP).
- "tacticalAdvice": An array of 3-4 bullet actions (exact staging spot, best approach route avoiding bottlenecks, which platform to turn on for max payout).
- "topOpportunityId": The ID of the best opportunity for this driver given their location (${driverZone}).
- "preSurgeWindowMinutes": Number of minutes remaining before public algorithms lock.
- "threatsToAvoid": 2 traffic bottlenecks or traps to avoid right now (e.g. CTE roadworks or Stadium Way front gate gridlock).
- "projectedEarningsBoost": e.g. "+$35 - $50 next hour".

Ensure your advice is concise, urgent, authoritative, and tailored for a driver reading on a mounted dashboard phone screen.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const responseText = response.text || '';
      try {
        const parsed = JSON.parse(responseText.trim());
        return res.json({
          success: true,
          intel: {
            ...parsed,
            mcpSignalsProcessed: activeWeather.length + activeIncidents.length + activeArrivals.length + activeEvents.length,
            timestamp: new Date().toISOString()
          }
        });
      } catch (parseError) {
        console.error('Failed to parse Gemini JSON output, falling back to rule-based dispatch:', parseError);
      }
    } catch (err: any) {
      console.warn('Gemini 3.8 Flash call encountered an issue, serving robust rule-based dispatch:', err.message);
    }
  }

  // Fallback high-fidelity rule-based Singapore transport dispatch engine
  const topOpp = activeOpportunities[0] || INITIAL_PRE_SURGE_OPPORTUNITIES[0];
  return res.json({
    success: true,
    intel: {
      briefingHeadline: `IMMEDIATE PRE-SURGE DISPATCH: Head to ${topOpp.zoneName}`,
      strategicSummary: `MCP sensors detect an urgent ${topOpp.predictedMultiplier}x surge catalyst forming at ${topOpp.zoneName}. Public algorithm surge pricing triggers in approx ${topOpp.timeToPublicSurgeMinutes} minutes. Positioning now guarantees front-of-queue priority before incoming driver saturation.`,
      tacticalAdvice: [
        topOpp.recommendedAction,
        topOpp.recommendedRoute,
        `Keep Tada and Grab apps running simultaneously; toggle 6-Seater / Premium mode if applicable.`,
        `Maintain steady speed to arrive before the ${topOpp.windowRemainingMinutes}-minute window closes.`
      ],
      topOpportunityId: topOpp.id,
      preSurgeWindowMinutes: topOpp.timeToPublicSurgeMinutes,
      mcpSignalsProcessed: 18,
      threatsToAvoid: [
        'Avoid CTE south-bound near Moulmein (heavy slowdown)',
        'Avoid Nicoll Highway Stadium Way front entrance (concert egress bottleneck)'
      ],
      projectedEarningsBoost: topOpp.estimatedFareBoost,
      timestamp: new Date().toISOString()
    }
  });
});

// API: AI Copilot Natural Language Dispatch Chat (Gemini 3.8 Flash)
app.post('/api/copilot/chat', async (req: Request, res: Response) => {
  const { message, driverLocation, currentOpportunityId } = req.body;

  if (ai) {
    try {
      const systemInstruction = `You are SurgeSG, an expert Singapore PHV (Grab, Gojek, Tada) & Taxi fleet co-pilot and surge tactician.
You possess real-time spatial knowledge of Singapore: ERP rates, Changi T1-4 terminal baggage cycles, LTA EMAS incidents, PIE/CTE/AYE expressways, SMRT/SBS rail lines, rain radar, and concert venue egress (National Stadium, Singapore Expo, MBS).
Your style is professional, direct, concise, and focused on maximizing the driver's net hourly earnings ($/hour) while minimizing unpaid empty cruising.
Keep replies punchy (under 120 words) with clear road routes and staging spots.`;

      const prompt = `Driver location: ${driverLocation || 'Bishan/Novena'}
Current Top Opportunity: ${currentOpportunityId || 'National Stadium Kallang'}
Driver Question: "${message}"

Give immediate, actionable dispatch advice. Cite road names, staging spots, and surge multipliers.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3
        }
      });

      return res.json({
        success: true,
        reply: response.text || 'Dispatch advising staging at Old Airport Road for Kallang concert egress.',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.warn('Gemini chat fallback:', err.message);
    }
  }

  // Fallback intelligent response
  return res.json({
    success: true,
    reply: `From ${driverLocation || 'your current location'}, the highest yield move right now is Kallang Sports Hub / National Stadium. The concert egress begins in ~8 minutes with over 54,000 attendees. Take Nicoll Highway into Guillemard Road to bypass Stadium Way gridlock. Fares will spike to 2.8x ($38-$52 per trip).`,
    timestamp: new Date().toISOString()
  });
});

// Setup Vite dev server or static file serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`SurgeSG Fleet Co-Pilot running on port ${port}`);
  });
}

startServer();
