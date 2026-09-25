import { GoogleGenAI, mcpToTool } from '@google/genai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // 1. Guardrail: GEMINI_API_KEY check
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return res.status(503).json({
      error: 'GEMINI_API_KEY is not set. Add it in Vercel and redeploy.'
    });
  }

  // 2. Validate question
  const { question } = req.body || {};
  if (!question || typeof question !== 'string' || question.trim() === '' || question.length > 500) {
    return res.status(400).json({
      error: 'Question is required, must be a string, and cannot exceed 500 characters.'
    });
  }

  const answered_at = new Date().toISOString();

  // 3. Parse MCP_SERVERS addresses
  const rawServers = process.env.MCP_SERVERS || '';
  const serverAddresses = rawServers
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const connectedClients = [];
  const unavailable = [];

  // Helper with 8 second timeout per server connection
  const connectWithTimeout = async (address) => {
    let client = null;
    try {
      client = new Client({ name: 'goat6-agent', version: '1.0.0' });
      const transport = new StreamableHTTPClientTransport(new URL(address));
      
      const connectPromise = client.connect(transport);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timed out after 8 seconds')), 8000)
      );

      await Promise.race([connectPromise, timeoutPromise]);
      connectedClients.push(client);
    } catch (err) {
      if (client) {
        try {
          await client.close();
        } catch (_) {}
      }
      unavailable.push({
        address,
        reason: err?.message || 'Connection failed'
      });
    }
  };

  try {
    // Connect to all configured MCP servers concurrently with 8s individual timeout
    await Promise.all(serverAddresses.map(addr => connectWithTimeout(addr)));

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const systemInstruction = 'Answer only from tool results. Give the source and the fetched_at time for every figure. If a tool returns an error or nothing, say so in one sentence and do not guess. At most 120 words.';

    const config = {
      systemInstruction
    };

    if (connectedClients.length > 0) {
      config.tools = [mcpToTool(...connectedClients)];
      config.automaticFunctionCalling = {
        maximumRemoteCalls: 6
      };
    }

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: question,
        config
      });
    } catch (genError) {
      const status = genError?.status || genError?.statusCode || 502;
      let message = 'Gemini model generation failed';
      if (genError?.message) {
        try {
          const parsed = JSON.parse(genError.message);
          message = parsed?.error?.message || genError.message.split('\n')[0];
        } catch (_) {
          message = genError.message.split('\n')[0];
        }
      }
      return res.status(502).json({
        error: `Gemini error (${status}): ${message}`,
        status,
        reason: message
      });
    }

    // 4. Build tool_calls from automaticFunctionCallingHistory
    const tool_calls = [];
    const history = response?.automaticFunctionCallingHistory || [];

    for (let i = 0; i < history.length; i++) {
      const turn = history[i];
      const parts = turn?.parts || turn?.content?.parts || [];

      for (const part of parts) {
        if (part?.functionCall) {
          const callName = part.functionCall.name;
          const callArgs = part.functionCall.args;

          // Look for matching functionResponse in subsequent history turns or parts
          let failed = false;
          for (let j = i; j < history.length; j++) {
            const respParts = history[j]?.parts || history[j]?.content?.parts || [];
            const matchingResp = respParts.find(
              p => p?.functionResponse && p.functionResponse.name === callName
            );
            if (matchingResp) {
              const respContent = matchingResp.functionResponse.response;
              if (
                respContent?.error ||
                (typeof respContent === 'string' && respContent.toLowerCase().includes('error')) ||
                (typeof respContent?.content === 'string' && respContent.content.toLowerCase().includes('error'))
              ) {
                failed = true;
              }
              break;
            }
          }

          tool_calls.push({
            name: callName,
            args: callArgs || {},
            failed
          });
        }
      }
    }

    return res.status(200).json({
      answer: response?.text || '',
      tool_calls,
      unavailable,
      model: 'gemini-3.8-flash',
      answered_at
    });
  } catch (err) {
    return res.status(500).json({
      error: err?.message || 'Internal server error while processing request'
    });
  } finally {
    // 5. Close every client in finally block
    for (const client of connectedClients) {
      try {
        await client.close();
      } catch (_) {}
    }
  }
}
