import { join } from "path";
import { readFileSync, writeFileSync } from "fs";
import { uniq } from "./utils";
import logger from "./logger";

export function getPlaceIds(country: string): number[] {
    const file = filePath(country);
    try {
        const content = readFileSync(file, 'utf8');
        return JSON.parse(content);
    } catch (e) {
        logger.error(`Error on reading file: ${file}`, e);
        return [];
    }
}

export function addPlaceIds(country: string, ids: number[]): number[] {
    const currentIds = uniq(getPlaceIds(country).concat(ids)).sort();
    const lines = JSON.stringify(currentIds)
        .replace(/,/g, ',\n').replace(/\[/, '[\n').replace(/\]/, '\n]');
    writeFileSync(filePath(country), lines, 'utf8');

    return currentIds;
}

function filePath(country: string) {
    country = country.trim().toLowerCase();
    return join(__dirname, '..', 'data', `places-${country}.json`);
}
