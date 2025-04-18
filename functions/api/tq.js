export async function onRequest(context) {
    // 1. 获取请求中的API密钥 (从URL查询参数中)
    const url = new URL(context.request.url);
    const apiKey = url.searchParams.get('apikey');
    
    // 检查API密钥是否存在
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'API key is required', message: 'Please include apikey as a query parameter' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 401,
        });
    }
    
    try {
        // 2. 从D1数据库验证API密钥
        // 假设我们有一个名为"API_KEYS"的D1数据库绑定
        const validKeyQuery = await context.env.API_KEYS.prepare(
            "SELECT * FROM api_keys WHERE key = ? AND active = 1"
        ).bind(apiKey).first();
        
        // 如果没有找到有效的API密钥
        if (!validKeyQuery) {
            return new Response(JSON.stringify({ error: 'Invalid API key' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 401,
            });
        }
        
        // 3. 从请求的地理位置信息中获取城市信息
        const { city } = context.request.cf || {};
    
        // 如果没有获取到城市信息，返回错误信息
        if (!city) {
            return new Response(JSON.stringify({ error: 'City information not available' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 400,
            });
        }
    
        // 4. 从环境变量中获取和风天气 API 密钥
        const weatherApiKey = context.env.HF_API_KEY;
        if (!weatherApiKey) {
            return new Response(JSON.stringify({ error: 'Weather API key not configured' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 500,
            });
        }
    
        // 5. 构建城市查询 API 请求 URL
        const cityLookupUrl = `https://geoapi.qweather.com/v2/city/lookup?location=${encodeURIComponent(city)}&key=${weatherApiKey}`;
    
        // 6. 发送请求到城市查询 API
        const cityLookupResponse = await fetch(cityLookupUrl);
      
        // 检查城市查询 API 响应状态
        if (!cityLookupResponse.ok) {
            return new Response(JSON.stringify({ error: 'Failed to fetch city data from third-party API' }), {
                headers: { 'Content-Type': 'application/json' },
                status: cityLookupResponse.status,
            });
        }
      
        // 获取城市查询 API 响应的 JSON 数据
        const cityLookupData = await cityLookupResponse.json();
      
        // 检查是否有返回的城市数据
        if (!cityLookupData || !cityLookupData.location || !cityLookupData.location.length) {
            return new Response(JSON.stringify({ error: 'City data not found' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 404,
            });
        }
      
        // 7. 获取城市查询 API 返回的第一个 location 的 id
        const firstLocationId = cityLookupData.location[0].id;
      
        // 8. 构建天气查询 API 请求 URL
        const weatherNowUrl = `https://devapi.qweather.com/v7/weather/now?key=${weatherApiKey}&location=${firstLocationId}`;
      
        // 9. 发送请求到天气查询 API
        const weatherNowResponse = await fetch(weatherNowUrl);
      
        // 检查天气查询 API 响应状态
        if (!weatherNowResponse.ok) {
            return new Response(JSON.stringify({ error: 'Failed to fetch weather data from third-party API' }), {
                headers: { 'Content-Type': 'application/json' },
                status: weatherNowResponse.status,
            });
        }
      
        // 获取天气查询 API 响应的 JSON 数据
        const weatherNowData = await weatherNowResponse.json();
      
        // 10. 可选：记录API使用情况
        await context.env.API_KEYS.prepare(
            "UPDATE api_keys SET request_count = request_count + 1, last_used = datetime('now') WHERE key = ?"
        ).bind(apiKey).run();
        
        // 11. 返回天气查询 API 响应数据
        return new Response(JSON.stringify(weatherNowData), {
            headers: { 'Content-Type': 'application/json' },
        });
      
    } catch (error) {
        // 返回错误信息
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
        });
    }
}