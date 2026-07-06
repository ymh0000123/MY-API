import { handleQWeatherRequest } from '../../lib/qweather.js';

export async function onRequest(context) {
    return handleQWeatherRequest(context, {
        qweatherGroup: 'grid-weather',
        locationType: 'grid',
        durationParam: 'hours',
        durationLabel: 'hours',
        defaultDuration: '24h',
        allowedDurations: ['24h', '72h'],
        upstreamErrorCode: 'GRID_WEATHER_HOURLY_LOOKUP_FAILED',
        upstreamErrorMessage: '调用和风天气格点逐小时预报接口失败，请稍后再试。',
    });
}
