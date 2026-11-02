import { getSubscriberData } from '../../server/youtube.mjs';

export default async function subscribers() {
  try {
    const data = await getSubscriberData(process.env);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      configured: Boolean(process.env.YOUTUBE_API_KEY || (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)),
      error: error instanceof Error ? error.message : 'Unable to load YouTube subscriber data.',
    }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }
}
