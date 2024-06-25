export async function handler(event, context) {
  const ip = event.request.headers.get('cf-connecting-ip'); // Cloudflare specific header
  return new Response(ip || 'Unable to determine IP address', {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}