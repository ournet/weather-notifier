
require('dotenv').config({ silent: true });

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
import * as zlib from 'zlib';
import * as http from 'https';
const parseCsv = require('csv-parse/lib/sync');


start(COUNTRY);


async function start(country: string) {

    const csvFileUrl = await requestCSVExport();

    let countTries = 0;
    let placesIds: number[]
    let newUsers: string;
    while (countTries < 10) {

        await delay(30);

        try {
            newUsers = await downloadNewUsers(csvFileUrl);
            break;
        } catch (e) {
            logger.error(`Error on trying to get CSV file: ${country}`, e);
        }

        countTries++;
    }

    if (newUsers) {
        placesIds = parsePlacesIdsFromUsers(newUsers);
    }

    if (placesIds) {
        addPlaceIds(country, placesIds);
    }
}

function downloadNewUsers(url: string) {
    console.log(`downloading ${url}...`);
    return new Promise<string>(function (resolve, reject) {
        // buffer to store the streamed decompression
        let buffer: string[] = [];

        http.get(url, function (res) {
            // pipe the response into the gunzip to decompress
            var gunzip = zlib.createGunzip();
            res.pipe(gunzip);

            gunzip.on('data', function (data) {
                // decompression chunk ready, add it to the buffer
                buffer.push(data.toString())

            }).on("end", function () {
                // response and decompression complete, join the buffer and return
                resolve(buffer.join(""));

            }).on("error", function (e) {
                reject(e);
            })
        }).on('error', function (e) {
            reject(e);
        });
    });
}

function parsePlacesIdsFromUsers(csvData: string): number[] {
    const lines: string[][] = parseCsv(csvData, { delimiter: ',' });
    if (!lines || !lines.length) {
        return [];
    }

    return lines.slice(1).map(items => {
        const stringTags = items[10] || '{}';
        const tags = JSON.parse(stringTags);
        return tags && tags['place-id'] && parseInt(tags['place-id']);
    }).filter(id => !!id);
}

function requestCSVExport(): Promise<string> {
    const lastActiveTime = Math.round((Date.now() - ms('7d')) / 1000);
    return new Promise(function (resolve, reject) {
        request({
            uri: `https://onesignal.com/api/v1/players/csv_export?app_id=${APP_ID}`,
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
