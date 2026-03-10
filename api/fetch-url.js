// Vercel Edge Function — fetches a URL server-side to bypass CORS
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get('url');

  if (!target) {
    return new Response(JSON.stringify({ error: 'No URL provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let finalUrl = target;
  if (!/^https?:\/\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;

  try {
    const start = Date.now();
    const res = await fetch(finalUrl, {
      headers: {
        'User-Agent': 'MDR-Audit-Bot/1.0 (website audit tool; +https://mdr-digital.vercel.app/audit)'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000)
    });

    const loadTime = Date.now() - start;
    const html = await res.text();
    const finalRedirect = res.url;
    const isHttps = finalRedirect.startsWith('https://');

    return new Response(JSON.stringify({
      html: html.substring(0, 80000),
      loadTime,
      isHttps,
      finalUrl: finalRedirect,
      status: res.status
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
