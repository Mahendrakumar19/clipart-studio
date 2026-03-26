# Clipart Studio

A React Native Android app that turns your photos into clipart. Pick a photo from your gallery or take one with your camera, and the app generates 5 different art styles at once — cartoon, anime, pixel art, sketch, and flat vector.

## Links

| Resource | Link |
|----------|------|
| APK Download | [Google Drive](#) |
| Screen Recording | [Google Drive](#) |

## How to run it locally

You'll need Node 18+ and the Expo CLI. I used Expo because it lets me build an APK through EAS without touching Android Studio, and the managed workflow keeps the project lean.

```bash
# clone and install everything
git clone https://github.com/mahendrakumar19/clipart-studio.git
cd clipart-studio

cd backend && npm install
cd ../frontend && npm install
```

### Backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and paste your keys:

```
REPLICATE_API_TOKEN=r8_your_token
GEMINI_API_KEY=your_gemini_key
PORT=3001
```

You can grab a Replicate token at https://replicate.com/account/api-tokens (free tier works, costs about a cent per image). The Gemini key is used for vision-based prompt enhancement on the free fallback path.

```bash
npm run dev
```

### Frontend

Open `frontend/src/utils/config.ts` and set the API URL to your machine's local IP:

```ts
export const API_BASE_URL = 'http://YOUR_LOCAL_IP:3001';
```

Then start Expo:

```bash
cd frontend
npx expo start
```

Scan the QR with Expo Go on your phone.

### Building the APK

```bash
cd frontend
eas login
eas build:configure
eas build -p android --profile preview
```

Takes about 10-15 min on EAS free tier. It gives you a download link when it's done.

### Deploying the backend

I went with Railway since it has a free starter plan:

```bash
npm install -g @railway/cli
cd backend
railway login && railway init && railway up
```

Then add your env vars in the Railway dashboard. Render works too if you prefer — just point it at the `/backend` folder and add the same env vars.

## Architecture

The app has 4 screens connected through Expo Router:

```
Upload → Preview → Generating → Results
```

The frontend never talks to AI services directly. Everything goes through a Node/Express backend that sits in front of the APIs. This keeps the API keys out of the APK (you can extract strings from APKs pretty trivially, so this was non-negotiable).

The backend tries three services in order:
1. **Replicate** (SDXL ControlNet) — best quality, uses the original photo as a structural guide so faces actually look right. Costs ~$0.005/image.
2. **AI Horde** — free community-powered img2img. Quality varies but it's zero cost.
3. **Pollinations** — free text-to-image as a last resort. Uses Gemini vision to describe the person first so the output at least resembles them.

If Replicate runs out of credits or hits rate limits, it automatically falls back to the free options. The user doesn't have to do anything.

## Project Structure

```
clipart-studio/
├── frontend/
│   ├── app/                    # screens (Expo Router)
│   │   ├── _layout.tsx         # navigation setup
│   │   ├── index.tsx           # upload screen
│   │   ├── preview.tsx         # image preview + advanced options
│   │   ├── generating.tsx      # skeleton loaders + progress
│   │   └── results.tsx         # grid + download/share
│   └── src/
│       ├── components/
│       │   └── BeforeAfterSlider.tsx
│       ├── hooks/
│       │   ├── useGenerateCliparts.ts
│       │   └── useImageStore.ts
│       └── utils/
│           ├── config.ts
│           └── imageUtils.ts
│
└── backend/
    ├── server.js
    ├── routes/generate.js
    ├── services/
    │   ├── replicate.js
    │   ├── aihorde.js
    │   └── pollinations.js
    └── utils/prompts.js
```

## Why I made certain choices

**React Native + Expo** — I'm more comfortable here than in pure Kotlin, and Expo's EAS Build gives me an APK without maintaining a whole `/android` folder. File-based routing through Expo Router is a nice bonus.

**SDXL ControlNet over other models** — most image generation models just create something "inspired by" a prompt. ControlNet actually uses the source photo as a depth/pose map, so the result looks like the same person in a different style. That felt important for a clipart generator — if someone uploads their face, the output should actually look like them.

**Staggered parallel generation** — I fire all 5 styles at once but with a small delay between each request (1.5s). Pure parallel was hitting Replicate's rate limits on the free tier, and fully sequential took over 2 minutes. The stagger is a middle ground — still feels fast (~35s total) but doesn't trigger 429s.

**Backend proxy** — honestly this was the biggest time sink. I could've just put the Replicate key in the app, but that's a security problem I didn't want to ship. The proxy also handles rate limiting and input validation, which I'd need anyway.

**State management** — I used `useSyncExternalStore` with a module-level store instead of pulling in Zustand or Redux. The state shape is tiny (one image URI + a results map + two settings values), so a full state library felt like overkill. Downside is no DevTools, but I can live with that.

**Stitch for initial UI** — I used Stitch to scaffold the screen layouts and component structure, then spent time refining things by hand — the dark theme, spring animations, the slider UX, haptic patterns. The initial scaffold got me moving fast but the polish pass is where most of the UI time went.

## Tradeoffs

- **ControlNet is slow** (~25-35s per style). OpenAI's models are faster but don't preserve identity as well. I went with quality over speed.
- **Base64 encoding** adds ~33% overhead to payloads, but keeping everything as JSON makes the API simpler than dealing with multipart form data.
- **Images are cached in the Expo cache directory**, so they get wiped if the user clears app data. A real production app would persist to `documentDirectory`, but for an MVP this is fine.
- **Style intensity is user-controllable** via a slider that maps 0-1 to ControlNet strength (0.4-0.95). More work to implement, but it gives users creative control over how "stylized" vs "faithful" the output is.

## What's in the app

**Core flow:**
- Upload from camera or gallery
- Preview your photo before generating
- All 5 styles generate with skeleton shimmer loaders and a progress bar
- Results in a 2-column grid with per-image download and share

**Bonus stuff I got in:**
- Before/after drag slider to compare original vs generated
- Prompt editor — type keywords like "vibrant" or "dark background" to guide the AI
- Style intensity slider — control how much the AI transforms vs preserves
- Per-style retry — if one fails you can retry just that one
- Save All button — downloads everything to camera roll in one tap
- Native share sheet on each card
- Haptic feedback throughout
- Client-side image compression (resizes to 1024px before upload)

## Security

- API keys live on the server only. Nothing sensitive in the APK.
- Helmet.js for HTTP security headers
- Rate limiting: 100 req/15min global, 15 generations/10min per IP
- Body size cap at 10MB
- Input validation via express-validator on every request

## Known issues

1. First generation can be slow (~45s) due to Replicate cold start. Subsequent ones are faster.
2. Complex backgrounds sometimes confuse the style transfer. Cropped portraits work best.
3. If your local IP changes, you need to update `config.ts`. For production, deploy the backend and use a stable URL.
4. No offline mode — needs internet for everything.

## Cost

Pretty cheap overall:
- Replicate: ~$0.005/image × 5 styles = ~$0.025 per generation
- Backend hosting: free (Railway starter)
- EAS builds: free (30/month)
