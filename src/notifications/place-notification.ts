import * as Links from 'ournet.links';
const Locales = require('../../locales.json');
import * as moment from 'moment-timezone';
import { PushNotification, getSymbolPriority } from './notification';
import { getForecastSymbolName } from '../utils';
import { getDayPeriodName } from '../day-periods';
import logger from '../logger';
import { createQueryApiClient, executeApiClient } from '../data';
import { PlaceStringFields, ForecastReport, ForecastReportStringFields, Place, HourlyForecastDataPoint } from '@ournet/api-client';
import { getPlaceName } from '../helpers';

export async function createPlaceNotification(country: string, lang: string, placeId: string): Promise<PushNotification> {

	const links = Links.sitemap(lang);
	const host = 'https://' + Links.getHost('weather', country);

	const placeData = await executeApiClient(createQueryApiClient<{ place: Place }>()
		.placesPlaceById('place', { fields: PlaceStringFields }, { id: placeId.toString() }));

	if (!placeData.place) {
		throw new Error(`Not found place: ${placeId}`);
	}

	const place = placeData.place;

	const forecastData = await executeApiClient(createQueryApiClient<{ forecast: ForecastReport }>()
		.weatherForecastReport('forecast', { fields: ForecastReportStringFields },
			{ place: { latitude: place.latitude, longitude: place.longitude, timezone: place.timezone } }));

	if (!forecastData.forecast || !forecastData.forecast.details) {
		throw new Error(`Place with out forecast: ${place.id}`);
	}

	const today = moment(new Date()).tz(place.timezone, false).locale(lang);
	const tomorrow = moment(new Date()).tz(place.timezone, false).locale(lang).add(1, 'day');

	const dayFormat = 'YYYY-MM-DD';

	const todayDateFormated = today.format(dayFormat);
	const tomorrowDateFormated = tomorrow.format(dayFormat);

	const todayForecast = forecastData.forecast.details.data.filter(item => moment(item.time * 1000).format(dayFormat) === todayDateFormated);
	const tomorrowForecast = forecastData.forecast.details.data.filter(item => moment(item.time * 1000).format(dayFormat) === tomorrowDateFormated);

	const notification = createSymbolNotification(todayForecast, tomorrowForecast, lang, place);
	if (notification) {
		notification.url = host + links.weather.place(place.id.toString(), {
			utm_source: 'weather-notifier-app',
			utm_campaign: 'weather-notifications',
			utm_medium: 'push-notification'
		});
	}

	return notification;
}

function createSymbolNotification(prevForecast: HourlyForecastDataPoint[], currentForecast: HourlyForecastDataPoint[], lang: string, place: Place) {

	if (!prevForecast || !currentForecast) {
		logger.warn(`invalid day forecast`);
		return null;
	}

	const prevMaxSymbolPriority = prevForecast.map(item => getSymbolPriority(item.icon)).sort((a, b) => b - a)[0];
	const currentMaxSymbolPriority = currentForecast.map(item => getSymbolPriority(item.icon)).sort((a, b) => b - a)[0];

	if (currentMaxSymbolPriority <= prevMaxSymbolPriority || currentMaxSymbolPriority < 1) {
		return null;
	}

	const locales = Locales[lang];

	const time = currentForecast.find(item => getSymbolPriority(item.icon) === currentMaxSymbolPriority);
	const date = moment(time.time).tz(place.timezone).locale(lang);
	const placeName = getPlaceName(place, lang);
	const symbolName = getForecastSymbolName(time.icon, lang);

	const timesByTemp = currentForecast.sort((a, b) => b.temperature - a.temperature);

	const maxTempTime = timesByTemp[0];
	const minTempTime = timesByTemp[timesByTemp.length - 1];

	const dayPeriod = getDayPeriodName(date.hour(), lang);

	const notification: PushNotification = {
		title: `${placeName}, ${locales.tomorrow}: ${symbolName.split(/,/)[0]}`,
		iconUrl: formatSymbolIconUrl(time.icon),
		content: `${Math.round(maxTempTime.temperature)}°C .. ${Math.round(minTempTime.temperature)}°, ${symbolName} ${dayPeriod}`,
		placeId: place.id,
		url: null,
		lang,
	};

	return notification;
}

function formatSymbolIconUrl(symbol: number) {
	return `https://assets.ournetcdn.net/root/img/icons/weather/256/${symbol}.png`;
}
