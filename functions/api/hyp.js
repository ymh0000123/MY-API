export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('uuid');

    if (uuid) {
        const response = await fetch(`https://api.hypixel.net/player?key=${context.env.HF_API_KEY}&uuid=${uuid}`);
        const data = await response.json();
        return new Response(JSON.stringify(data), { status: 200 });
    } else {
        return new Response('No UUID provided', { status: 400 });
    }
}