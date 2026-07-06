import { handleQWeatherRequest } from '../../lib/qweather.js';

export async function onRequest(context) {
    return handleQWeatherRequest(context, {
        qweatherGroup: 'weather',
        fixedPath: 'now',
        locationType: 'city',
        upstreamErrorCode: 'WEATHER_LOOKUP_FAILED',
        upstreamErrorMessage: '调用和风天气实时天气接口失败，请稍后再试。',
    });
}
