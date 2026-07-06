import { handleQWeatherRequest } from '../../lib/qweather.js';

export async function onRequest(context) {
    return handleQWeatherRequest(context, {
        qweatherGroup: 'weather',
        locationType: 'city',
        durationParam: 'hours',
        durationLabel: 'hours',
        defaultDuration: '24h',
        allowedDurations: ['24h', '72h', '168h'],
        upstreamErrorCode: 'WEATHER_HOURLY_LOOKUP_FAILED',
        upstreamErrorMessage: '调用和风天气逐小时预报接口失败，请稍后再试。',
    });
}
