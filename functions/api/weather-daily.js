import { handleQWeatherRequest } from '../../lib/qweather.js';

export async function onRequest(context) {
    return handleQWeatherRequest(context, {
        qweatherGroup: 'weather',
        locationType: 'city',
        durationParam: 'days',
        durationLabel: 'days',
        defaultDuration: '3d',
        allowedDurations: ['3d', '7d', '10d', '15d', '30d'],
        upstreamErrorCode: 'WEATHER_DAILY_LOOKUP_FAILED',
        upstreamErrorMessage: '调用和风天气每日预报接口失败，请稍后再试。',
    });
}
