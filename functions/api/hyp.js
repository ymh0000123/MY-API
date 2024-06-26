export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('uuid');

    if (id) {
        const response = await fetch(`https://api.hypixel.net/v2/playerr?uuid=${id}`);
        const data = await response.json();
        return new Response(JSON.stringify(data), { status: 200 },{headers: { 'Content-Type': 'application/json' ,'API-Key': context.env.HF_API_KEY},});
    } else {
        return new Response('No UUID provided', { status: 400 });
    }
}