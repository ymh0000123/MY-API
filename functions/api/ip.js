export async function onRequest(context) {
    const clientIP = context.request.headers.get('cf-connecting-ip') || 'IP Not Found';
    return new Response(clientIP, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }