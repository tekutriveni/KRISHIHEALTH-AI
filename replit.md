# KrishiHealth AI

A comprehensive web application for Indian farmers built with React + Express (TypeScript).

## Features

- **Crop Disease Detection**: Upload photo or describe crop problem → Gemini AI analyzes and returns disease name, severity, solution, action plan (0-48h), spread info, and recommended medicine. Option to SMS-alert neighbor farmers.
- **Daily Health Check-ins**: Smart farmer health questions at session times (7AM morning / 12PM noon / 6PM evening). 8 questions per session, AI returns green/yellow/red status with personalized advice.
- **Mandi Prices**: Real-time wholesale market prices for 10 crops in Telangana & Andhra Pradesh. Refresh with AI-generated prices. Voice search support.
- **AI Farming Chat**: Conversational AI assistant for farming questions. Voice input/output via Web Speech API. Quick suggestion chips.
- **SMS Alerts**: Send disease/health/mandi alerts via Twilio to individual or group of farmers. Alert history.
- **Multilingual**: Full support for English / Telugu (తెలుగు) / Hindi (हिंदी). All AI responses in selected language.
- **Voice I/O**: Web Speech API for voice input (mic) and voice output (text-to-speech) throughout the app.

## Tech Stack

- **Frontend**: React + TypeScript + Wouter (routing) + TanStack Query + Shadcn/UI + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **AI**: Google Gemini 2.5 Flash via Replit AI Integration (no user API key needed)
- **SMS**: Twilio (credentials in env secrets)
- **Storage**: In-memory (MemStorage) - seeded with 10 mandi crop prices

## Architecture

```
client/src/
  pages/          - home, disease, health, mandi, chat, alerts
  components/     - Layout (header + bottom nav)
  hooks/          - useLanguage, useVoice
  lib/            - language.ts (translations), queryClient.ts

server/
  index.ts        - Express server entry
  routes.ts       - All API endpoints + Gemini AI + Twilio
  storage.ts      - MemStorage implementation

shared/
  schema.ts       - Drizzle schema + Zod types
```

## API Routes

- `POST /api/disease-detect` - Multipart (image optional) → Gemini disease analysis
- `GET /api/disease-detections` - History
- `POST /api/health-checkin` - Q&A answers → Gemini health advice
- `GET /api/health-checkins` - History
- `GET /api/mandi-prices` - Current prices
- `POST /api/mandi-prices/refresh` - AI-refresh prices
- `POST /api/sms/send` - Single SMS via Twilio
- `POST /api/sms/send-group` - Group SMS
- `GET /api/sms-alerts` - History
- `POST /api/ai-chat` - General farming Q&A

## Environment Secrets Required

- `TWILIO_ACCOUNT_SID` - Must start with "AC"
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `AI_INTEGRATIONS_GEMINI_API_KEY` - Auto-set by Replit AI integration
- `AI_INTEGRATIONS_GEMINI_BASE_URL` - Auto-set by Replit AI integration

## Design

- Earthy green theme: primary HSL(95 55% 38%)
- Warm cream background: HSL(60 20% 96%)
- Poppins font
- Mobile-first, large touch-friendly buttons (min-h-[3.5rem])
- Dark sidebar with bottom navigation bar
