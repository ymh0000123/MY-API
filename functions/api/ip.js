addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
  })
  
  async function handleRequest(request) {
    const ip = request.headers.get('cf-connecting-ip')
    const userAgent = request.headers.get('user-agent')
    const { city, region, country } = request.cf.geo
    
    const responseData = {
      ip,
      userAgent,
      location: {
        city,
        region,
        country
      }
    }
    
    return new Response(JSON.stringify(responseData), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
  