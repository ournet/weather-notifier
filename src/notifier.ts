
import * as request from 'request';
import logger from './logger';
import ms = require('ms');
import { getPlaceIds } from './places';
import { PushNotification } from './notifications/notification';
import { createPlaceNotification } from './notifications/place-notification';
import { delay } from './utils';

export async function send(apiKey: string, appId: string, country: string, lang: string, isTest: boolean) {

	const placeIds = getPlaceIds(country);

	let sumRecipients = 0;

	for (let placeId of placeIds) {
		try {
			const notification = await createPlaceNotification(country, lang, placeId);
			if (notification) {
				const result = await sendNotification(apiKey, appId, notification, isTest);
				sumRecipients += result.recipients;
			}
		} catch (e) {
			logger.error(e);
		}
		await delay(300);
	}

	logger.warn('Total recipients: ' + sumRecipients);
}

function sendNotification(apiKey: string, appId: string, notification: PushNotification, isTest: boolean): Promise<SendResult> {
	if (isTest) {
		console.log('sending notification', notification);
		return Promise.reject(`Stop`);
	}
	const body: any = {
		app_id: appId,
		contents: {},
		headings: {},
		url: notification.url,
		delayed_option: 'timezone',
		delivery_time_of_day: '5:00PM',
		chrome_web_icon: notification.iconUrl,
		// in seconds
		ttl: Math.round(ms('12h')),
	};

	if (isTest) {
		body.included_segments = ['Test Users'];
	} else {
		body.filters = [
			{ field: 'last_session', relation: '>', value: 24 },
			{ operator: 'AND' },
			{ field: 'tag', key: 'place-id', relation: '=', value: notification.placeId }
		];
	}

	body.contents.en =
		body.contents[notification.lang] = notification.content;
	body.headings.en =
		body.headings[notification.lang] = notification.title;

	// console.log('sending body', body);

	return new Promise(function (resolve, reject) {
		request({
			uri: 'https://onesignal.com/api/v1/notifications',
			method: 'POST',
			headers: {
				'Authorization': 'Basic ' + apiKey
			},
			json: true,
			body: body
		}, function (error, _req, rBody) {
			if (error) {
				return reject(error);
			}
			resolve(rBody);
		});
	});
}

type SendResult = {
	recipients: number
	errors?: any
}

