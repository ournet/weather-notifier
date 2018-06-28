
require('dotenv').config({ silent: true });

//--	env
const COUNTRY = process.env.COUNTRY;
if (!COUNTRY) {
    logger.error('COUNTRY is required');
    throw 'COUNTRY are required';
}
const API_KEY = process.env[COUNTRY.toUpperCase() + '_ONESIGNAL_API_KEY'];
const APP_ID = process.env[COUNTRY.toUpperCase() + '_ONESIGNAL_APP_ID'];

//-- validation

if (!API_KEY || !APP_ID || !COUNTRY) {
    logger.error('API_KEY, APP_ID, COUNTRY are required');
    throw 'API_KEY, APP_ID, COUNTRY are required';
}


import * as request from 'request';
import logger from '../logger';

async function start() {
    let offset = 0;
    const limit = 50;
    let notifications: ApiNotification[];
    do {
        notifications = await getNotifications(API_KEY, APP_ID, offset, limit)
        for (let item of notifications) {
            await deleteNotification(API_KEY, APP_ID, item.id);
        }
    }
    while (notifications.length === limit);
}

start();

function deleteNotification(apiKey: string, appId: string, id: string) {
    console.log(`deleting id=${id}`);
    return new Promise<{ sucess: boolean }>(function (resolve, reject) {
        request({
            uri: `https://onesignal.com/api/v1/notifications/${id}?app_id=${appId}`,
            method: 'DELETE',
            headers: {
                'Authorization': 'Basic ' + apiKey
            },
            json: true,
        }, function (error, _req, rBody) {
            if (error) {
                return reject(error);
            }
            resolve(rBody);
        });
    });
}

function getNotifications(apiKey: string, appId: string, offset: number, limit: number) {
    return new Promise<ApiNotification[]>(function (resolve, reject) {
        request({
            uri: `https://onesignal.com/api/v1/notifications?app_id=${appId}&limit=${limit}&offset=${offset}`,
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + apiKey
            },
            json: true,
        }, function (error, _req, rBody) {
            if (error) {
                return reject(error);
            }
            resolve(rBody.notifications.map((item: any) => ({ id: item.id })));
        });
    });
}

type ApiNotification = {
    id: string
}
