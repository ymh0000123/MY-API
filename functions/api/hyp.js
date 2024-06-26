async function handleRequest(request) {
    const { id } = request.params;

    const mojangUrl = `https://api.mojang.com/users/profiles/minecraft/${id}`;
    const mojangResponse = await fetch(mojangUrl);
    const mojangData = await mojangResponse.json();
    const mojangId = mojangData.id;

    const hypixelUrl = `https://api.hypixel.net/v2/player?key=${process.env.HYPIXEL_API_KEY}&uuid=${mojangId}`;
    const hypixelResponse = await fetch(hypixelUrl);
    const hypixelData = await hypixelResponse.json();

    return new Response(JSON.stringify(hypixelData), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
