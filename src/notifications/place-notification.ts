import * as Links from 'ournet.links';
const Locales = require('../../locales.json');
import * as moment from 'moment-timezone';
import { Place, ForecastDay, getPlaceName } from '../place';
import { PushNotification, getSymbolPriority } from './notification';
import { getForecastSymbolName } from '../utils';
import { getDayPeriodName } from '../day-periods';
import logger from '../logger';
import { createQueryApiClient, executeApiClient } from '../data';
import { PlaceStringFields, ForecastReport, ForecastReportStringFields } from '@ournet/api-client';

export async function createPlaceNotification(country: string, lang: string, placeId: string): Promise<PushNotification> {

	const links = Links.sitemap(lang);
	const host = 'https://' + Links.getHost('weather', country);

	const placeData = await executeApiClient(createQueryApiClient<{ place: Place }>()
		.placesPlaceById('place', { fields: PlaceStringFields }, { id: placeId }));

	if (!placeData.place) {
		throw new Error(`Not found place: ${placeId}`);
	}

	const place: Place = placeData.place;

	const forecastData = await executeApiClient(createQueryApiClient<{ forecast: ForecastReport }>()
		.weatherForecastReport('forecast', { fields: ForecastReportStringFields },
			{ place: { latitude: place.latitude, longitude: place.longitude, timezone: place.timezone } }));

	if (!forecastData.forecast) {
		throw new Error(`Place with out forecast: ${place.id}`);
	}

	const today = moment(new Date()).tz(place.timezone, false).locale(lang);
	const tomorrow = moment(new Date()).tz(place.timezone, false).locale(lang).add(1, 'day');

	const todayDateFormated = today.format('YYYY-MM-DD');
	const tomorrowDateFormated = tomorrow.format('YYYY-MM-DD');

	const todayForecast = place.forecast.days.find(item => item.date === todayDateFormated);
	const tomorrowForecast = place.forecast.days.find(item => item.date === tomorrowDateFormated);

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

function createSymbolNotification(prevForecast: ForecastDay, currentForecast: ForecastDay, lang: string, place: Place) {

	if (!prevForecast || !prevForecast.times || !currentForecast || !currentForecast.times) {
		logger.warn(`invalid day forecast`);
		return null;
	}

	const prevMaxSymbolPriority = prevForecast.times.map(item => getSymbolPriority(item.symbol.number)).sort((a, b) => b - a)[0];
	const currentMaxSymbolPriority = currentForecast.times.map(item => getSymbolPriority(item.symbol.number)).sort((a, b) => b - a)[0];

	if (currentMaxSymbolPriority <= prevMaxSymbolPriority || currentMaxSymbolPriority < 1) {
		return null;
	}

	const locales = Locales[lang];

	const time = currentForecast.times.find(item => getSymbolPriority(item.symbol.number) === currentMaxSymbolPriority);
	const date = moment(time.time).tz(place.timezone).locale(lang);
	const placeName = getPlaceName(place, lang);
	const symbolName = getForecastSymbolName(time.symbol.number, lang);

	const timesByTemp = currentForecast.times.sort((a, b) => b.t.value - a.t.value);

	const maxTempTime = timesByTemp[0];
	const minTempTime = timesByTemp[timesByTemp.length - 1];

	const dayPeriod = getDayPeriodName(date.hour(), lang);

	const notification: PushNotification = {
		title: `${placeName}, ${locales.tomorrow}: ${symbolName.split(/,/)[0]}`,
		iconUrl: formatSymbolIconUrl(time.symbol.number),
		content: `${Math.round(maxTempTime.t.value)}°C .. ${Math.round(minTempTime.t.value)}°, ${symbolName} ${dayPeriod}`,
		placeId: place.id,
		url: null,
		lang,
	};

	return notification;
}

function formatSymbolIconUrl(symbol: number) {
	return `https://assets.ournetcdn.net/root/img/icons/weather/256/${symbol}.png`;
}
