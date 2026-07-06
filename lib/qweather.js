const jsonHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
};

export function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        headers: jsonHeaders,
        status,
    });
}

export function errorResponse(status, code, message, details = undefined) {
    return jsonResponse({
        success: false,
        error: {
            code,
            message,
            ...(details ? { details } : {}),
        },
    }, status);
}

export function getApiKey(request, url) {
    const authorization = request.headers.get('authorization') || '';
    const bearerPrefix = 'Bearer ';
    const hasBearerToken = authorization.toLowerCase().startsWith(bearerPrefix.toLowerCase());

    return (
        url.searchParams.get('apikey') ||
        url.searchParams.get('apiKey') ||
        url.searchParams.get('api_key') ||
        request.headers.get('x-api-key') ||
        (hasBearerToken ? authorization.slice(bearerPrefix.length).trim() : '')
    )?.trim();
}

function getCoordinateLocation(url, cf = {}) {
    const longitude = String(
        url.searchParams.get('lon') ||
        url.searchParams.get('lng') ||
        url.searchParams.get('longitude') ||
        cf.longitude ||
        ''
    ).trim();
    const latitude = String(
        url.searchParams.get('lat') ||
        url.searchParams.get('latitude') ||
        cf.latitude ||
        ''
    ).trim();

    if (!longitude || !latitude) {
        return '';
    }

    return `${longitude},${latitude}`;
}

function buildQWeatherUrl(path, weatherApiKey, params) {
    const upstreamUrl = new URL(`https://devapi.qweather.com/v7/${path}`);

    upstreamUrl.searchParams.set('key', weatherApiKey);
    for (const [key, value] of Object.entries(params)) {
        if (value) {
            upstreamUrl.searchParams.set(key, value);
        }
    }

    return upstreamUrl.toString();
}

function normalizeDuration(value, allowedDurations, defaultDuration) {
    if (!allowedDurations) {
        return '';
    }

    const normalizedValue = value?.trim().toLowerCase();
    if (!normalizedValue) {
        return defaultDuration;
    }

    const duration = /^[0-9]+$/.test(normalizedValue)
        ? `${normalizedValue}${defaultDuration.slice(-1)}`
        : normalizedValue;

    return allowedDurations.includes(duration) ? duration : '';
}

async function validateClientApiKey(context, apiKey) {
    if (!apiKey) {
        return errorResponse(401, 'MISSING_API_KEY', '缺少 apikey。请使用 ?apikey=你的密钥，或通过 x-api-key 请求头传入。');
    }

    if (!context.env.API_KEYS) {
        return errorResponse(500, 'API_KEYS_NOT_CONFIGURED', '服务端未绑定 API_KEYS 数据库，暂时无法校验 apikey。');
    }

    const validKeyQuery = await context.env.API_KEYS.prepare(
        "SELECT * FROM api_keys WHERE key = ? AND active = 1"
    ).bind(apiKey).first();

    if (!validKeyQuery) {
        return errorResponse(401, 'INVALID_API_KEY', 'apikey 无效或已停用，请检查密钥是否正确。');
    }

    return null;
}

async function resolveCityLocation(url, context, weatherApiKey) {
    const explicitLocation = url.searchParams.get('location')?.trim();
    if (explicitLocation) {
        return explicitLocation;
    }

    const coordinateLocation = getCoordinateLocation(url, context.request.cf || {});
    if (coordinateLocation) {
        return coordinateLocation;
    }

    const { city } = context.request.cf || {};
    if (!city) {
        throw errorResponse(400, 'LOCATION_UNAVAILABLE', '缺少 location 参数，也无法从当前请求识别城市或经纬度。');
    }

    const lookupUrl = new URL('https://geoapi.qweather.com/v2/city/lookup');
    lookupUrl.searchParams.set('location', city);
    lookupUrl.searchParams.set('key', weatherApiKey);

    const cityLookupResponse = await fetch(lookupUrl.toString());
    if (!cityLookupResponse.ok) {
        throw errorResponse(cityLookupResponse.status, 'CITY_LOOKUP_FAILED', '调用和风天气城市查询接口失败，请稍后再试。');
    }

    const cityLookupData = await cityLookupResponse.json();
    if (!cityLookupData?.location?.length) {
        throw errorResponse(404, 'CITY_NOT_FOUND', `未找到城市「${city}」对应的天气位置数据。`);
    }

    return cityLookupData.location[0].id;
}

function resolveGridLocation(url, context) {
    const explicitLocation = url.searchParams.get('location')?.trim();
    if (explicitLocation) {
        return explicitLocation;
    }

    const coordinateLocation = getCoordinateLocation(url, context.request.cf || {});
    if (coordinateLocation) {
        return coordinateLocation;
    }

    throw errorResponse(400, 'GRID_LOCATION_REQUIRED', '格点天气必须提供经纬度，请使用 ?location=经度,纬度，或分别传入 lon 和 lat。');
}

async function recordUsage(context, apiKey) {
    await context.env.API_KEYS.prepare(
        "UPDATE api_keys SET request_count = request_count + 1, last_used = datetime('now') WHERE key = ?"
    ).bind(apiKey).run();
}

export async function handleQWeatherRequest(context, options) {
    const url = new URL(context.request.url);
    const apiKey = getApiKey(context.request, url);

    try {
        const apiKeyError = await validateClientApiKey(context, apiKey);
        if (apiKeyError) {
            return apiKeyError;
        }

        const weatherApiKey = context.env.HF_API_KEY;
        if (!weatherApiKey) {
            return errorResponse(500, 'WEATHER_API_KEY_NOT_CONFIGURED', '服务端未配置 HF_API_KEY，暂时无法查询天气。');
        }

        const duration = normalizeDuration(
            url.searchParams.get(options.durationParam),
            options.allowedDurations,
            options.defaultDuration
        );

        if (options.allowedDurations && !duration) {
            return errorResponse(400, 'INVALID_RANGE', `${options.durationLabel} 参数不支持，请使用：${options.allowedDurations.join('、')}。`);
        }

        const location = options.locationType === 'grid'
            ? resolveGridLocation(url, context)
            : await resolveCityLocation(url, context, weatherApiKey);

        const path = [options.qweatherGroup, options.fixedPath || duration].join('/');
        const weatherUrl = buildQWeatherUrl(path, weatherApiKey, {
            location,
            lang: url.searchParams.get('lang') || 'zh',
            unit: url.searchParams.get('unit') || undefined,
        });

        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        if (!weatherResponse.ok) {
            return errorResponse(weatherResponse.status, options.upstreamErrorCode, options.upstreamErrorMessage, weatherData);
        }

        await recordUsage(context, apiKey);

        return jsonResponse(weatherData);
    } catch (error) {
        if (error instanceof Response) {
            return error;
        }

        console.error('QWeather API error:', error);
        return errorResponse(500, 'INTERNAL_SERVER_ERROR', '服务器处理请求时发生错误，请稍后再试。');
    }
}
