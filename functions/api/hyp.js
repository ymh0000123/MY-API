addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
  })
  
  async function handleRequest(request) {
    // 获取请求的玩家ID
    const playerId = extractPlayerId(request)
  
    // 构建请求到Mojang API
    const mojangResponse = await fetch(`https://api.mojang.com/users/profiles/minecraft/${playerId}`)
    const mojangData = await mojangResponse.json()
  
    // 获取Mojang API返回的ID
    const mojangId = mojangData.id
  
    // 构建请求到Hypixel API，从环境变量中读取API密钥
    const hypixelApiKey = process.env.HYPIXEL_API_KEY
    const hypixelResponse = await fetch(`https://api.hypixel.net/v2/player?key=${hypixelApiKey}&uuid=${mojangId}`)
    const hypixelData = await hypixelResponse.json()
  
    // 获取Hypixel API返回的UUID
    const hypixelUuid = hypixelData.player.uuid
  
    // 返回UUID给调用方
    return new Response(JSON.stringify({ uuid: hypixelUuid }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
  
  function extractPlayerId(request) {
    // 根据实际情况从请求中提取玩家ID的方法，比如从query参数中获取
    const url = new URL(request.url)
    return url.searchParams.get('id')
  }
  