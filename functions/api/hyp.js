addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const id = url.pathname.substr(1); // 从请求的路径中获取id

    try {
        const mojangId = await fetchMojangProfile(id);
        const hypixelUuid = await fetchHypixelUUID(mojangId);

        return new Response(JSON.stringify({ hypixelUuid }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        return new Response(err.message || 'Internal Server Error', { status: 500 });
    }
}

async function fetchMojangProfile(id) {
    const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${id}`);
    if (!response.ok) {
        throw new Error('Failed to fetch Mojang profile');
    }
    const data = await response.json();
    return data.id; // 返回Mojang返回的id
}

async function fetchHypixelUUID(mojangId) {
    const apiKey = await getSecret('hypixel_api_key');
    const response = await fetch(`https://api.hypixel.net/v2/player?key=${apiKey}&uuid=${mojangId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch Hypixel UUID');
    }
    const data = await response.json();
    return data.player.uuid; // 返回Hypixel返回的uuid
}

async function getSecret(secretName) {
    const secretResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${CLOUDFLARE_SCRIPT_NAME}/secrets/${secretName}`, {
        headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
    });
    if (!secretResponse.ok) {
        throw new Error(`Failed to fetch secret ${secretName}`);
    }
    const secretData = await secretResponse.json();
    return secretData.secret.text;
}
