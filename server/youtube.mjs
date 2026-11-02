import { createSign } from 'node:crypto';

const API_BASE = 'https://www.googleapis.com/youtube/v3/channels';
const PLAYLIST_ITEMS_BASE = 'https://www.googleapis.com/youtube/v3/playlistItems';
const SEARCH_BASE = 'https://www.googleapis.com/youtube/v3/search';
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';

let cachedAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Exchange service account credentials for a Google OAuth2 access token.
 */
async function getServiceAccountAccessToken(email, privateKey) {
  const now = Math.floor(Date.now() / 1000);

  if (cachedAccessToken && now < tokenExpiresAt - 60) {
    return cachedAccessToken;
  }

  const formattedKey = privateKey.replace(/\\n/g, '\n');

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/youtube.readonly',
    aud: OAUTH_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };

  const toBase64Url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsignedToken = `${toBase64Url(header)}.${toBase64Url(payload)}`;

  const signer = createSign('RSA-SHA256');
  signer.update(unsignedToken);
  const signature = signer.sign(formattedKey, 'base64url');
  const jwtAssertion = `${unsignedToken}.${signature}`;

  const tokenResponse = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwtAssertion,
    }),
  });

  const tokenData = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenData.access_token) {
    const message = tokenData?.error_description || tokenData?.error || `Failed to authenticate service account (${tokenResponse.status})`;
    throw new Error(message);
  }

  cachedAccessToken = tokenData.access_token;
  tokenExpiresAt = now + (Number(tokenData.expires_in) || 3600);
  return cachedAccessToken;
}

// Fallback curated videos from @the_rustyy in case YouTube list items is throttled
const FALLBACK_VIDEOS = [
  {
    id: "ANRBCV-wrJg",
    title: "More Exploringg | Elden Ring",
    thumbnail: "https://i.ytimg.com/vi/ANRBCV-wrJg/mqdefault.jpg",
    publishedAt: "2026-11-02T05:59:35Z"
  },
  {
    id: "o1eh5raShZk",
    title: "Getting Out Of This Annoyinggg Cave !!! | Elden Ring",
    thumbnail: "https://i.ytimg.com/vi/o1eh5raShZk/mqdefault.jpg",
    publishedAt: "2026-11-01T16:58:06Z"
  },
  {
    id: "XDhjVoxeza0",
    title: "More Catacombs!!!! | Elden Ring",
    thumbnail: "https://i.ytimg.com/vi/XDhjVoxeza0/mqdefault.jpg",
    publishedAt: "2026-11-01T07:47:29Z"
  },
  {
    id: "0S53MugKePI",
    title: "WATCH DOGS 2 IS PURE CHAOS 😭 | FIRST PLAYTHROUGH 🔥",
    thumbnail: "https://i.ytimg.com/vi/0S53MugKePI/mqdefault.jpg",
    publishedAt: "2026-10-06T03:29:10Z"
  },
  {
    id: "0P08iQj9U38",
    title: "Chilling in Valorant",
    thumbnail: "https://i.ytimg.com/vi/0P08iQj9U38/mqdefault.jpg",
    publishedAt: "2026-09-27T18:58:02Z"
  },
  {
    id: "2vMDrPGuJwc",
    title: "Worst Ending of Blair Witch !!!",
    thumbnail: "https://i.ytimg.com/vi/2vMDrPGuJwc/mqdefault.jpg",
    publishedAt: "2026-09-25T06:04:19Z"
  }
];

/** Fetch the public subscriber count & channel videos for the configured YouTube handle. */
export async function getSubscriberData(env = process.env) {
  const apiKey = env.YOUTUBE_API_KEY;
  const saEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const saPrivateKey = env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const handle = (env.YOUTUBE_HANDLE || 'the_rustyy').replace(/^@/, '');

  const hasApiKey = Boolean(apiKey);
  const hasServiceAccount = Boolean(saEmail && saPrivateKey);

  if (!hasApiKey && !hasServiceAccount) {
    return {
      configured: false,
      handle: `@${handle}`,
      channelUrl: `https://www.youtube.com/@${handle}`,
      subscriberCount: null,
      message: 'Add YOUTUBE_API_KEY or Service Account credentials to your environment to enable the live count.',
      videos: FALLBACK_VIDEOS,
      featuredVideo: FALLBACK_VIDEOS[0],
      isLiveNow: false,
      liveVideo: null,
    };
  }

  const url = new URL(API_BASE);
  url.searchParams.set('part', 'snippet,statistics,contentDetails');
  url.searchParams.set('forHandle', `@${handle}`);

  const headers = { Accept: 'application/json' };
  let accessToken = null;

  if (hasApiKey) {
    url.searchParams.set('key', apiKey);
  } else {
    accessToken = await getServiceAccountAccessToken(saEmail, saPrivateKey);
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(12000),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const apiMessage = payload?.error?.message || `YouTube API returned ${response.status}`;
    throw new Error(apiMessage);
  }

  const channel = payload?.items?.[0];
  if (!channel) {
    throw new Error(`No YouTube channel was found for @${handle}. Check YOUTUBE_HANDLE.`);
  }

  const rawCount = channel.statistics?.subscriberCount;
  const subscriberCount = rawCount == null ? null : Number(rawCount);
  if (subscriberCount !== null && !Number.isFinite(subscriberCount)) {
    throw new Error('YouTube returned an invalid subscriber count.');
  }

  // Check if channel is currently live streaming
  let isLiveNow = false;
  let liveVideo = null;
  try {
    const searchUrl = new URL(SEARCH_BASE);
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('channelId', channel.id);
    searchUrl.searchParams.set('eventType', 'live');
    searchUrl.searchParams.set('type', 'video');
    if (hasApiKey) {
      searchUrl.searchParams.set('key', apiKey);
    }

    const liveRes = await fetch(searchUrl, {
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (liveRes.ok) {
      const liveData = await liveRes.json();
      const liveItem = liveData.items?.[0];
      if (liveItem?.id?.videoId) {
        isLiveNow = true;
        liveVideo = {
          id: liveItem.id.videoId,
          title: `🔴 LIVE NOW: ${liveItem.snippet?.title || 'Rustyy Live Stream'}`,
          thumbnail:
            liveItem.snippet?.thumbnails?.medium?.url ||
            liveItem.snippet?.thumbnails?.default?.url ||
            `https://i.ytimg.com/vi/${liveItem.id.videoId}/mqdefault.jpg`,
          publishedAt: liveItem.snippet?.publishedAt,
          isLive: true,
        };
      }
    }
  } catch {
    // live check timeout/skip
  }

  // Fetch recent videos from uploads playlist
  let videos = [...FALLBACK_VIDEOS];
  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (uploadsPlaylistId) {
    try {
      const plUrl = new URL(PLAYLIST_ITEMS_BASE);
      plUrl.searchParams.set('part', 'snippet');
      plUrl.searchParams.set('maxResults', '15');
      plUrl.searchParams.set('playlistId', uploadsPlaylistId);
      if (hasApiKey) {
        plUrl.searchParams.set('key', apiKey);
      }

      const plRes = await fetch(plUrl, {
        headers,
        signal: AbortSignal.timeout(8000),
      });

      if (plRes.ok) {
        const plData = await plRes.json();
        if (Array.isArray(plData.items) && plData.items.length > 0) {
          const seenIds = new Set();
          const uniqueFetched = [];

          for (const item of plData.items) {
            const vidId = item.snippet?.resourceId?.videoId;
            if (vidId && !seenIds.has(vidId)) {
              seenIds.add(vidId);
              uniqueFetched.push({
                id: vidId,
                title: item.snippet?.title || 'Rustyy Video',
                thumbnail:
                  item.snippet?.thumbnails?.medium?.url ||
                  item.snippet?.thumbnails?.default?.url ||
                  `https://i.ytimg.com/vi/${vidId}/mqdefault.jpg`,
                publishedAt: item.snippet?.publishedAt,
                isLive: false,
              });
            }
          }

          if (uniqueFetched.length > 0) {
            videos = uniqueFetched;
          }
        }
      }
    } catch {
      // fallback to FALLBACK_VIDEOS
    }
  }

  // Deduplicate and ensure live video appears first if active
  const deduplicatedVideos = [];
  const seenVideoIds = new Set();

  if (isLiveNow && liveVideo) {
    seenVideoIds.add(liveVideo.id);
    deduplicatedVideos.push(liveVideo);
  }

  for (const v of videos) {
    if (!seenVideoIds.has(v.id)) {
      seenVideoIds.add(v.id);
      deduplicatedVideos.push(v);
    }
  }

  // Always feature the latest upload (or the live stream if currently live)
  const featuredVideo = isLiveNow && liveVideo ? liveVideo : deduplicatedVideos[0] || FALLBACK_VIDEOS[0];

  return {
    configured: true,
    handle: `@${handle}`,
    channelId: channel.id,
    channelTitle: channel.snippet?.title || 'Rustyy',
    channelUrl: `https://www.youtube.com/channel/${channel.id}`,
    subscriberCount,
    hiddenSubscriberCount: Boolean(channel.statistics?.hiddenSubscriberCount),
    updatedAt: new Date().toISOString(),
    videos: deduplicatedVideos,
    featuredVideo,
    isLiveNow,
    liveVideo,
    message: subscriberCount === null
      ? 'This channel does not expose a public subscriber count.'
      : null,
  };
}
