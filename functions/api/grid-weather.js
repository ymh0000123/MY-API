import { handleQWeatherRequest } from '../../lib/qweather.js';

export async function onRequest(context) {
    return handleQWeatherRequest(context, {
        qweatherGroup: 'grid-weather',
        fixedPath: 'now',
        locationType: 'grid',
        upstreamErrorCode: 'GRID_WEATHER_LOOKUP_FAILED',
        upstreamErrorMessage: '调用和风天气格点实时天气接口失败，请稍后再试。',
    });
}
