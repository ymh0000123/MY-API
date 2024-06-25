addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 获取请求的IP地址
  const ip = request.headers.get('CF-Connecting-IP')

  // 获取请求的浏览器信息
  const userAgent = request.headers.get('User-Agent')

  // 获取请求的地区信息
  const cf = request.cf
  const country = cf?.country // 获取国家信息
  const city = cf?.city // 获取城市信息

  // 构造响应数据
  const response = {
    ip: ip,
    userAgent: userAgent,
    country: country,
    city: city
  }

  // 返回JSON格式的响应
  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  })
}
