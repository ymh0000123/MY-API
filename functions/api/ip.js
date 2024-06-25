export async function onRequest(context) {
    // 获取请求的客户端 IP 地址
    const clientIP = context.request.headers.get('cf-connecting-ip') || 'IP Not Found';
    
    // 获取请求的地理位置信息
    const { city, region, country } = context.request.cf || {};
  
    // 创建包含 IP 地址和地理位置信息的 JSON 响应对象
    const jsonResponse = JSON.stringify({
      ip: clientIP,
      location: {
        city: city || 'Unknown',
        region: region || 'Unknown',
        country: country || 'Unknown',
      }
    });
  
    // 返回 JSON 响应
    return new Response(jsonResponse, {
      headers: { 'Content-Type': 'application/json' },
    });
  }