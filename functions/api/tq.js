export async function onRequest(context) {
    // 从请求的地理位置信息中获取城市信息
    const { city } = context.request.cf || {};
  
    // 如果没有获取到城市信息，返回错误信息
    if (!city) {
        return new Response(JSON.stringify({ error: 'City information not available' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 400,
        });
    }
  
    // 从环境变量中获取 API 密钥
    const apiKey = context.env.API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'API key not configured' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
        });
    }
  
    // 构建第一个 API 请求 URL
    const cityLookupUrl = `https://geoapi.qweather.com/v2/city/lookup?location=${encodeURIComponent(city)}&key=${apiKey}`;
  
    try {
        // 发送请求到第一个 API
        const cityLookupResponse = await fetch(cityLookupUrl);
      
        // 检查第一个 API 响应状态
        if (!cityLookupResponse.ok) {
            return new Response(JSON.stringify({ error: 'Failed to fetch city data from third-party API' }), {
                headers: { 'Content-Type': 'application/json' },
                status: cityLookupResponse.status,
            });
        }
      
        // 获取第一个 API 响应的 JSON 数据
        const cityLookupData = await cityLookupResponse.json();
      
        // 检查是否有返回的城市数据
        if (!cityLookupData || !cityLookupData.location || !cityLookupData.location.length) {
            return new Response(JSON.stringify({ error: 'City data not found' }), {
                headers: { 'Content-Type': 'application/json' },
                status: 404,
            });
        }
      
        // 获取第一个 API 返回的第一个 location 的 id
        const firstLocationId = cityLookupData.location[0].id;
      
        // 构建第二个 API 请求 URL
        const weatherNowUrl = `https://devapi.qweather.com/v7/weather/now?key=${apiKey}&location=${firstLocationId}`;
      
        // 发送请求到第二个 API
        const weatherNowResponse = await fetch(weatherNowUrl);
      
        // 检查第二个 API 响应状态
        if (!weatherNowResponse.ok) {
            return new Response(JSON.stringify({ error: 'Failed to fetch weather data from third-party API' }), {
                headers: { 'Content-Type': 'application/json' },
                status: weatherNowResponse.status,
            });
        }
      
        // 获取第二个 API 响应的 JSON 数据
        const weatherNowData = await weatherNowResponse.json();
      
        // 返回第二个 API 响应数据
        return new Response(JSON.stringify(weatherNowData), {
            headers: { 'Content-Type': 'application/json' },
        });
      
    } catch (error) {
        // 返回错误信息
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
        });
    }
}
