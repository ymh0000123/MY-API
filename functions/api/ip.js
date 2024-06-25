export async function onRequest(context) {
  // 获取请求的客户端 IP 地址
  const clientIP = context.request.headers.get('cf-connecting-ip') || 'IP Not Found';
  
  // 获取请求的地理位置信息，包括城市、地区、国家和邮政编码
  const { city, region, country, postalCode } = context.request.cf || {};

  // 创建包含 IP 地址、地理位置信息和邮政编码的 JSON 响应对象
  const jsonResponse = JSON.stringify({
    ip: clientIP,
    location: {
      city: city || 'Unknown',
      region: region || 'Unknown',
      country: country || 'Unknown',
      postalCode: postalCode || 'Unknown'
    }
  });

  // 返回 JSON 响应
  return new Response(jsonResponse, {
    headers: { 'Content-Type': 'application/json' },
  });
}
