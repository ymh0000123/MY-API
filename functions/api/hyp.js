const jsonHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
};

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: jsonHeaders,
    });
}

function errorResponse(status, code, message) {
    return jsonResponse({
        success: false,
        error: {
            code,
            message,
        },
    }, status);
}

export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('uuid')?.trim();

    if (!id) {
        return errorResponse(400, 'MISSING_UUID', '缺少 uuid 参数，请使用 /api/hyp?uuid=玩家UUID 进行查询。');
    }

    if (!context.env.HYPIXEL_API_KEY) {
        return errorResponse(500, 'HYPIXEL_API_KEY_NOT_CONFIGURED', '服务端未配置 HYPIXEL_API_KEY，暂时无法查询 Hypixel 玩家信息。');
    }

    try {
        const response = await fetch(`https://api.hypixel.net/v2/player?uuid=${encodeURIComponent(id)}`, {
            headers: { 'API-Key': context.env.HYPIXEL_API_KEY }
        });
        const data = await response.json();

        if (!response.ok) {
            return errorResponse(response.status, 'HYPIXEL_LOOKUP_FAILED', '调用 Hypixel 玩家接口失败，请检查 uuid 或稍后再试。');
        }

        return jsonResponse(data);
    } catch (error) {
        console.error('Hypixel API error:', error);
        return errorResponse(500, 'INTERNAL_SERVER_ERROR', '服务器处理请求时发生错误，请稍后再试。');
    }
}
