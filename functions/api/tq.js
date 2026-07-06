const jsonHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
};

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        headers: jsonHeaders,
        status,
    });
}

function errorResponse(status, code, message, details = undefined) {
    return jsonResponse({
        success: false,
        error: {
            code,
            message,
            ...(details ? { details } : {}),
        },
    }, status);
}

export async function onRequest(context) {
    // 1. 获取请求中的 API 密钥 (从 URL 查询参数中)
    const url = new URL(context.request.url);
    const apiKey = url.searchParams.get('apikey');
    
    // 检查 API 密钥是否存在
    if (!apiKey) {
        return errorResponse(401, 'MISSING_API_KEY', '缺少 apikey 参数，请在请求地址中添加 ?apikey=你的密钥。');
    }
    
    try {
        // 2. 从 D1 数据库验证 API 密钥
        // 假设我们有一个名为 "API_KEYS" 的 D1 数据库绑定
        const validKeyQuery = await context.env.API_KEYS.prepare(
            "SELECT * FROM api_keys WHERE key = ? AND active = 1"
        ).bind(apiKey).first();
        
        // 如果没有找到有效的 API 密钥
        if (!validKeyQuery) {
            return errorResponse(401, 'INVALID_API_KEY', 'apikey 无效或已停用，请检查密钥是否正确。');
        }
        
        // 3. 从请求的地理位置信息中获取城市信息
        const { city } = context.request.cf || {};
    
        // 如果没有获取到城市信息，返回错误信息
        if (!city) {
            return errorResponse(400, 'CITY_UNAVAILABLE', '无法从当前请求识别城市信息，请确认请求经过 Cloudflare 并启用了地理位置数据。');
        }
    
        // 4. 从环境变量中获取和风天气 API 密钥
        const weatherApiKey = context.env.HF_API_KEY;
        if (!weatherApiKey) {
            return errorResponse(500, 'WEATHER_API_KEY_NOT_CONFIGURED', '服务端未配置 HF_API_KEY，暂时无法查询天气。');
        }
    
        // 5. 构建城市查询 API 请求 URL
        const cityLookupUrl = `https://geoapi.qweather.com/v2/city/lookup?location=${encodeURIComponent(city)}&key=${weatherApiKey}`;
    
        // 6. 发送请求到城市查询 API
        const cityLookupResponse = await fetch(cityLookupUrl);
      
        // 检查城市查询 API 响应状态
        if (!cityLookupResponse.ok) {
            return errorResponse(cityLookupResponse.status, 'CITY_LOOKUP_FAILED', '调用和风天气城市查询接口失败，请稍后再试。');
        }
      
        // 获取城市查询 API 响应的 JSON 数据
        const cityLookupData = await cityLookupResponse.json();
      
        // 检查是否有返回的城市数据
        if (!cityLookupData || !cityLookupData.location || !cityLookupData.location.length) {
            return errorResponse(404, 'CITY_NOT_FOUND', `未找到城市「${city}」对应的天气位置数据。`);
        }
      
        // 7. 获取城市查询 API 返回的第一个 location 的 id
        const firstLocationId = cityLookupData.location[0].id;
      
        // 8. 构建天气查询 API 请求 URL
        const weatherNowUrl = `https://devapi.qweather.com/v7/weather/now?key=${weatherApiKey}&location=${firstLocationId}`;
      
        // 9. 发送请求到天气查询 API
        const weatherNowResponse = await fetch(weatherNowUrl);
      
        // 检查天气查询 API 响应状态
        if (!weatherNowResponse.ok) {
            return errorResponse(weatherNowResponse.status, 'WEATHER_LOOKUP_FAILED', '调用和风天气实时天气接口失败，请稍后再试。');
        }
      
        // 获取天气查询 API 响应的 JSON 数据
        const weatherNowData = await weatherNowResponse.json();
      
        // 10. 可选：记录 API 使用情况
        await context.env.API_KEYS.prepare(
            "UPDATE api_keys SET request_count = request_count + 1, last_used = datetime('now') WHERE key = ?"
        ).bind(apiKey).run();
        
        // 11. 返回天气查询 API 响应数据
        return jsonResponse(weatherNowData);
      
    } catch (error) {
        // 返回错误信息
        console.error('Error:', error);
        return errorResponse(500, 'INTERNAL_SERVER_ERROR', '服务器处理请求时发生错误，请稍后再试。');
    }
}
