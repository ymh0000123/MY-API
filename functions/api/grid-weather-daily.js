import { handleQWeatherRequest } from '../../lib/qweather.js';

export async function onRequest(context) {
    return handleQWeatherRequest(context, {
        qweatherGroup: 'grid-weather',
        locationType: 'grid',
        durationParam: 'days',
        durationLabel: 'days',
        defaultDuration: '3d',
        allowedDurations: ['3d', '7d'],
        upstreamErrorCode: 'GRID_WEATHER_DAILY_LOOKUP_FAILED',
        upstreamErrorMessage: '调用和风天气格点每日预报接口失败，请稍后再试。',
    });
}
