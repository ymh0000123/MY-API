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
  
    // 构建第三方 API 请求 URL
    const url = `https://geoapi.qweather.com/v2/city/lookup?location=${encodeURIComponent(city)}&key=${apiKey}`;
  
    try {
        // 发送请求到第三方 API
        const apiResponse = await fetch(url);
      
        // 检查 API 响应状态
        if (!apiResponse.ok) {
            return new Response(JSON.stringify({ error: 'Failed to fetch data from third-party API' }), {
                headers: { 'Content-Type': 'application/json' },
                status: apiResponse.status,
            });
        }
      
        // 获取 API 响应的 JSON 数据
        const data = await apiResponse.json();
      
        // 返回 API 响应数据
        return new Response(JSON.stringify(data), {
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
