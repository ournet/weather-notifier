import * as Links from 'ournet.links';
const Locales = require('../../locales.json');
import * as moment from 'moment-timezone';
import * as Data from '../data';
import { Place, ForecastDay, getPlaceName } from '../place';
import { PushNotification } from './notification';
import { getForecastSymbolName } from '../utils';

export async function createPlaceNotification(country: string, lang: string, placeId: number)
	: Promise<PushNotification> {

	placeId = parseInt(placeId.toString());
	const links = Links.sitemap(lang);
	const host = 'https://' + Links.getHost('weather', country);
	const locales = Locales[lang];

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
		notification.url = host + links.weather.place(place.id.toString());
	}

	return notification;
}

function createSymbolNotification(prevForecast: ForecastDay, currentForecast: ForecastDay, lang: string, place: Place) {

	const prevMaxSymbol = prevForecast.times.map(item => item.symbol.number).sort((a, b) => b - a)[0];
	const currentMaxSymbol = currentForecast.times.map(item => item.symbol.number).sort((a, b) => b - a)[0];

	if (currentMaxSymbol <= prevMaxSymbol || currentMaxSymbol <= 5) {
		return null;
	}

	const time = currentForecast.times.find(item => item.symbol.number === currentMaxSymbol);
	const date = moment(time.time).tz(place.timezone).locale(lang);
	const placeName = getPlaceName(place, lang);
	const symbolName = getForecastSymbolName(currentMaxSymbol, lang);

	const timesByTemp = currentForecast.times.sort((a, b) => b.t.value - a.t.value);

	const maxTempTime = timesByTemp[0];
	const minTempTime = timesByTemp[timesByTemp.length - 1];

	const notification: PushNotification = {
		title: `${placeName}, ${date.format('dddd')}: ${symbolName.split(/,/)[0]}`,
		iconUrl: formatSymbolIconUrl(currentMaxSymbol),
		content: `${Math.round(maxTempTime.t.value)}° .. ${Math.round(minTempTime.t.value)}°, ${symbolName}`,
		placeId: place.id,
		url: null,
		lang,
	};

	return notification;
}

function formatSymbolIconUrl(symbol: number) {
	return `http://assets.ournetcdn.net/root/img/icons/weather/256/${symbol}.png`;
}
