import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Gemini SDK with User-Agent header as required
const apiKey = process.env.GEMINI_API_KEY || '';
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

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    name: 'சக்தி AI Service',
    geminiConfigured: !!ai,
    time: new Date().toISOString(),
  });
});

// Chat endpoint for Sakthi AI
app.post('/api/sakthi/chat', async (req, res) => {
  try {
    const { prompt, existingTasks, userLocation } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API is not configured. Switching to offline engine.',
        offlineRequired: true,
      });
    }

    const systemInstruction = `You are Sakthi (சக்தி), a dependable, enthusiastic, sharp personal assistant from Tamil Nadu.
You communicate fluently and naturally in Thanglish (Tamil written in Latin script with familiar Tamil words and tone, such as: "Vanakkam thalaiva!", "Kandippa boss, ippove pannidren!", "Naalaki kaalaila 9 manikku meeting schedule aagiduchu!", "High priority-la vachurukken bro", "Relax-ah irunga, Sakthi irukken!").
Your voice personality is energetic, confident, and respectful (using words like 'thalaiva', 'boss', 'bro', 'nanba').

Current Context:
- Current Date/Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} (IST)
- Existing Tasks Count: ${Array.isArray(existingTasks) ? existingTasks.length : 0}
- User Location (if available): ${userLocation ? JSON.stringify(userLocation) : 'Not shared'}

Capabilities:
1. Tasks & Prioritization: Priority can be 'high' (Romba mukkiyam / Urgent), 'medium' (Normal / Moderate), or 'low' (Poruma / Casual).
2. Recurring Reminders: Recurrence can be 'none', 'daily' (dhinamum), 'weekly' (vaaram oru murai), 'monthly' (maadham oru murai), or 'custom' (e.g. 'Every 2 days', 'Weekdays').
3. Location-Based Reminders: Supports trigger on 'arrive' or 'depart' for locations like 'Home', 'Office', 'Gym', 'Market', 'College', 'Clinic', or any place specified by the user.
4. Calendar queries: Checking today's schedule, tomorrow's tasks, or organizing time.

Instructions:
- Interpret the user's intent from Tamil, Thanglish, or English.
- Always generate:
  - "reply": Friendly, lively conversational Thanglish message that sounds natural when spoken by a Tamil male voice.
  - "tamilScript": The equivalent in Tamil script (e.g., "வணக்கம் பாஸ்!").
  - "speechText": Clean phonetic Thanglish text for text-to-speech reading (clear pronunciation).
  - "actions": Array of structured actions extracted (e.g. create_task, complete_task, delete_task, filter_priority, query_tasks).
    - If user wants to create a task/reminder, include action { type: 'create_task', title, priority ('high'|'medium'|'low'), dueDate (YYYY-MM-DD), dueTime (HH:mm), recurrence ('none'|'daily'|'weekly'|'monthly'|'custom'), customInterval, locationTrigger: { type: 'arrive'|'depart', placeName, radiusMeters }, category ('work'|'personal'|'health'|'routine'|'urgent'), notes }.
    - If user wants to filter/sort: { type: 'filter_priority', priority: 'high'|'medium'|'low'|'all' } or { type: 'sort', sortBy: 'priority'|'due_date'|'title' }.
    - If user asks for summary or schedule: { type: 'query_tasks' }.`;

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'Conversational response in friendly Thanglish',
            },
            tamilScript: {
              type: Type.STRING,
              description: 'Response written in Tamil script',
            },
            speechText: {
              type: Type.STRING,
              description: 'Phonetic text for Tamil/Indian male TTS audio',
            },
            actions: {
              type: Type.ARRAY,
              description: 'List of detected actions to execute in the app',
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: 'Action type: create_task, complete_task, delete_task, filter_priority, query_tasks',
                  },
                  title: { type: Type.STRING, description: 'Task title' },
                  priority: { type: Type.STRING, description: 'high, medium, or low' },
                  dueDate: { type: Type.STRING, description: 'Date in YYYY-MM-DD' },
                  dueTime: { type: Type.STRING, description: 'Time in HH:mm 24hr format' },
                  recurrence: { type: Type.STRING, description: 'none, daily, weekly, monthly, custom' },
                  customInterval: { type: Type.STRING, description: 'Custom recurrence description' },
                  locationTrigger: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING, description: 'arrive or depart' },
                      placeName: { type: Type.STRING, description: 'Name of the place' },
                      radiusMeters: { type: Type.NUMBER, description: 'Geofence radius in meters, default 150' },
                    },
                  },
                  category: { type: Type.STRING, description: 'work, personal, health, routine, or urgent' },
                  notes: { type: Type.STRING, description: 'Additional notes' },
                },
                required: ['type'],
              },
            },
          },
          required: ['reply', 'speechText'],
        },
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI response timed out after 9 seconds')), 9000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: unknown) {
    console.error('Error generating Sakthi response:', error);
    res.status(500).json({
      error: 'Failed to process AI response. Local offline engine will take over.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sakthi AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
