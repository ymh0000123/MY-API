addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || request.headers.get('x-real-ip') || request.headers.get('Remote_Addr') || request.headers.get('True-Client-IP') || request.headers.get('X-Real-Ip') || request.headers.get('X-Real-Ip');

  return new Response(ip, {
    headers: { 'content-type': 'text/plain' },
  });
}
