
//--	env
const COUNTRY = process.env.COUNTRY;
if (!COUNTRY) {
    logger.error('COUNTRY is required');
    throw 'COUNTRY and LANG are required';
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
import ms = require('ms');
import { delay } from '../utils';
import { addPlaceIds } from '../places';



async function start(country: string) {

    const csvFileUrl = await requestCSVExport();

    let countTries = 0;
    let placesIds: number[]
    while (countTries < 10) {

        await delay(30);

        try {
            const newUsers = await downloadNewUsers(csvFileUrl);
            placesIds = parsePlacesIdsFromUsers(newUsers);
            break;
        } catch (e) {
            logger.error(`Error on trying to get CSV file: ${country}`, e);
        }

        countTries++;
    }

    if (placesIds) {
        addPlaceIds(country, placesIds);
    }
}

function downloadNewUsers(url: string) {
    return new Promise<string>(function (resolve, reject) {
        request({
            uri: url,
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + API_KEY
            }
        }, function (error, _req, rBody) {
            if (error) {
                return reject(error);
            }
            resolve(rBody);
        });
    });
}

function parsePlacesIdsFromUsers(csvData: string): number[] {
    console.log(csvData);
    return [];
}

function requestCSVExport(): Promise<string> {
    const lastActiveTime = Math.round((Date.now() - ms('7d')) / 1000);
    return new Promise(function (resolve, reject) {
        request({
            uri: `https://onesignal.com/api/v1/notifications?app_id=${APP_ID}`,
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + API_KEY
            },
            json: true,
            body: {
                last_active_since: lastActiveTime
            }
        }, function (error, _req, rBody) {
            if (error) {
                return reject(error);
            }
            resolve(rBody.csv_file_url);
        });
    });
}
