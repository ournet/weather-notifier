import * as Links from 'ournet.links';
const Locales = require('../../locales.json');
import * as moment from 'moment-timezone';
import * as Data from '../data';
import { Place, ForecastDay, getPlaceName } from '../place';
import { PushNotification, getSymbolPriority } from './notification';
import { getForecastSymbolName } from '../utils';
import * as util from 'util';
import { getDayPeriodName } from '../day-periods';

export async function createPlaceNotification(country: string, lang: string, placeId: number): Promise<PushNotification> {

	placeId = parseInt(placeId.toString());
	const links = Links.sitemap(lang);
	const host = 'https://' + Links.getHost('weather', country);

	const placeData = await Data.get({
		place: ['placeForecast', {
			placeId
		}],
	});

	if (placeData.errors) {
		throw new Error('OURNET API error');
	}

	const place: Place = placeData.place;

	if (!place.forecast) {
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

	const prevMaxSymbolPriority = prevForecast.times.map(item => getSymbolPriority(item.symbol.number)).sort((a, b) => b - a)[0];
	const currentMaxSymbolPriority = currentForecast.times.map(item => getSymbolPriority(item.symbol.number)).sort((a, b) => b - a)[0];

	if (currentMaxSymbolPriority <= prevMaxSymbolPriority || currentMaxSymbolPriority < 1) {
		return null;
	}

	const locales = Locales[lang];

	const time = currentForecast.times.find(item => getSymbolPriority(item.symbol.number) === currentMaxSymbolPriority);
	const date = moment(time.time).tz(place.timezone).locale(lang);
	const placeName = getPlaceName(place, lang);
	const symbolName = getForecastSymbolName(currentMaxSymbolPriority, lang);

	const timesByTemp = currentForecast.times.sort((a, b) => b.t.value - a.t.value);

	const maxTempTime = timesByTemp[0];
	const minTempTime = timesByTemp[timesByTemp.length - 1];

	const dayPeriod = getDayPeriodName(date.hour(), lang);

	const notification: PushNotification = {
		title: `${placeName}, ${locales.tomorrow}: ${symbolName.split(/,/)[0]}`,
		iconUrl: formatSymbolIconUrl(currentMaxSymbolPriority),
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
