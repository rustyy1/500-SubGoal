# RUSTYY — The 500 Quest

A cinematic, story-mode-inspired subscriber milestone website for **[@the_rustyy](https://www.youtube.com/@the_rustyy)**.

The site has one objective only: reach **500 YouTube subscribers**. Watch hours and monetisation progress are intentionally not included.

## What is included

- Cinematic story-mode atmosphere with rotating mountain and forest backdrops served from Unsplash.
- Responsive desktop and mobile layout.
- Live subscriber counter through the YouTube Data API v3.
- Progress bar and remaining-subscriber count to the 500 goal.
- A milestone celebration with party-popper visuals, screen-filling confetti and repeated bursts.
- A thank-you screen ending with **“WAIT FOR THE CREATOR.”**
- A local browser unlock flag: once a visitor's browser has seen the 500 milestone, that browser stays on the thank-you screen.
- Optional Lottie and MP3 assets that can be downloaded from the source pages below and dropped into `public/assets/`.
- Preview routes so the mission and 500 celebration can be tested before publishing.

> The project does not contain any third-party game screenshots. The default backgrounds are cinematic landscape photographs with a story-mode feel. Use your own gameplay screenshots or footage if you have the rights to publish them.

## 1. Requirements

- Node.js 22.12 or newer (Vite 8 requirement)
- npm
- A Google Cloud project with **YouTube Data API v3** enabled
- A YouTube Data API key

## 2. Set up the YouTube API key

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Enable **YouTube Data API v3** in APIs & Services → Library.
4. Create an API key under APIs & Services → Credentials.
5. In this project folder, copy `.env.example` to `.env`.
6. Put your key in `.env`:

```env
YOUTUBE_API_KEY=your_real_api_key_here
YOUTUBE_HANDLE=the_rustyy
```

**Keep the key private.** Do not rename it to `VITE_YOUTUBE_API_KEY`, do not commit `.env`, and do not paste it into frontend code. The API request runs in the local Node API server or the Netlify Function.

The API uses `channels.list` with `forHandle=@the_rustyy` and reads the public `statistics.subscriberCount` field. The channel handle can be changed using `YOUTUBE_HANDLE`.

## 3. Run locally

Open a terminal in the project folder and run:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

The dev command starts:
- Vite on port `5173`
- A small local API server on port `8787`

The Vite server proxies `/api/subscribers` to the local API server. The API response is cached for 60 seconds, and the browser refreshes the displayed count every two minutes.

If the API key is not configured, the site clearly shows that the live counter needs setup. It does not invent or silently display a fake subscriber count.

## 4. Preview the experience

The preview routes use clearly marked sample data and do not call the YouTube API.

| URL | What it shows |
|---|---|
| `http://localhost:5173/?preview=mission` | Mission screen with sample count `327 / 500` |
| `http://localhost:5173/?preview=celebration` | Runs the 500-subscriber celebration, then shows the thank-you screen |
| `http://localhost:5173/?preview=mission&reset=1` | Clears the local milestone flag and previews the mission screen |

Preview counts are examples only. The live site uses the real API response.

## 5. Optional downloaded celebration assets

The celebration works without optional downloads because the project already includes the confetti burst effect and animated popper fallback. To use downloadable Lottie / sound assets from the online asset sites, download the **free** format from the asset page and place the files at these exact paths:

| File to add | Download source |
|---|---|
| `public/assets/party-popper.json` | [LottieFiles — Party Popper Confetti](https://lottiefiles.com/free-animation/party-popper-confetti-eqMTpvy6QL) |
| `public/assets/confetti.json` | [LottieFiles — Full Screen Confetti](https://lottiefiles.com/free-animation/confetti-full-screen-xgkBYevLrg) |
| `public/assets/party-popper.mp3` | [Pixabay — Party Popper Light Pop](https://pixabay.com/sound-effects/film-special-effects-party-popper-light-pop-508699/) |

The app checks for these files automatically. If the Lottie files are absent, the built-in canvas confetti and CSS party poppers are used. If the MP3 is absent, the celebration remains silent. Check the asset's current licence and download terms before publishing; keep any required attribution with your project.

### Background image sources

The default rotating backgrounds are served from the Unsplash image CDN:

- [Mountain lake landscape](https://images.unsplash.com/photo-1470770841072-f978cf4d019e)
- [Mountain range](https://images.unsplash.com/photo-1464822759023-fed622ff2c3b)
- [Forest landscape](https://images.unsplash.com/photo-1511497584788-876760111969)

See the [Unsplash License](https://unsplash.com/license). Images are loaded from the internet, so an internet connection is required for the remote background photographs. Replace the URLs in `src/App.tsx` with your own gameplay images if preferred.

## 6. Deploy to Netlify

1. Push this folder to a GitHub repository.
2. Import the repository into Netlify.
3. Netlify should detect `netlify.toml` automatically.
4. In Netlify → Site configuration → Environment variables, add:

```env
YOUTUBE_API_KEY=your_real_api_key_here
YOUTUBE_HANDLE=the_rustyy
```

5. Trigger a deploy.

Build settings are already defined in `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist`
- Function directory: `netlify/functions`

The `/api/subscribers` route is rewritten to the serverless function. The API key stays on the server and is not bundled into the frontend.

## 7. Important milestone behaviour

- The celebration starts when the live API response first reaches at least 500 subscribers.
- The browser stores the unlocked milestone in `localStorage`, so that same visitor sees the thank-you screen on later visits.
- A visitor arriving while the live count is still at or above 500 will see the celebration once on that browser, then the thank-you screen on later visits.
- This first version stores the “already celebrated” marker per browser. It does not use a shared database to synchronise that marker across every visitor/device. The live count itself remains fetched from YouTube.

## Useful commands

```bash
npm run dev      # local development
npm run build    # production build
npm run preview  # preview the production build locally
```

## Project structure

```text
rustyy-500-quest/
├── netlify/
│   └── functions/
│       └── subscribers.mjs
├── public/
│   └── assets/              # optional downloaded Lottie / MP3 files
├── server/
│   ├── dev-api.mjs          # local API server
│   └── youtube.mjs          # shared YouTube Data API logic
├── src/
│   ├── lib/
│   │   └── types.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── .env.example
├── netlify.toml
├── package.json
└── README.md
```
