
import * as Links from 'ournet.links';
const Locales = require('../locales.json');
import * as moment from 'moment';
import * as Data from './data';
import { Place } from './place';

export async function createNotification(country: string, lang: string, placeId: number):Promise<PushNotification> {
	placeId = parseInt(placeId.toString());
	const links = Links.sitemap(lang);
	const host = 'https://' + Links.getHost('weather', country);
	const locales = Locales[lang];

	const currentDate = moment().locale(lang);

	const placeData = await Data.get({
		place: ['place', {
			placeId
		}],
	});

	if (placeData.errors) {
		throw new Error('OURNET API error');
	}

	const place: Place = placeData.place;

	const forecastData = await Data.get({
		forecast: ['forecast', {
			latitude: place.latitude,
			longitude: place.longitude,
		}],
	});

	if (forecastData.errors) {
		throw new Error('OURNET API error');
	}

	console.log(forecastData);

	return null;

	// let sumRecipients = 0;

	// const notifications = (<any[]>data.reports).map<Notification>(report => {
	// 	const sign = data.signs[report.sign][lang];
	// 	const notification: Notification = {
	// 		lang: lang,
	// 		url: host + links.horoscope.sign(sign.slug, { utm_source: 'horo-notifier-app', utm_campaign: 'horo-notifications', utm_medium: 'push-notification' }),
	// 		title: sign.name + ': ' + locales.today_horoscope,
	// 		content: report.text.split(/\n+/g)[0].substr(0, 200).trim() + '...',
	// 		signId: report.sign
	// 	};

	// 	return notification;
	// })

	// for (let notification of notifications) {
	// 	const result = await sendNotification(apiKey, appId, notification, isTest);
	// 	sumRecipients += result.recipients;
	// 	logger.warn('For sign ' + notification.signId + ' sent ' + result.recipients, { sign: notification.signId, recipients: result.recipients, errors: result.errors });
	// }

	// logger.warn('Total recipients: ' + sumRecipients);
}

export type PushNotification = {
	lang: string
	url: string
	title: string
	content: string
	placeId: number
	iconUrl: string
}
