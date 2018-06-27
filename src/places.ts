import { join } from "path";
import { readFileSync, writeFileSync } from "fs";
import { uniq } from "./utils";

export function getPlaceIds(country: string): number[] {
    const content = readFileSync(filePath(country), 'utf8');
    return JSON.parse(content);
}

export function addPlaceIds(country: string, ids: number[]): number[] {
    const currentIds = uniq(getPlaceIds(country).concat(ids)).sort();
    writeFileSync(filePath(country), JSON.stringify(currentIds), 'utf8');

    return currentIds;
}

function filePath(country: string) {
    country = country.trim().toLowerCase();
    return join(__dirname, '..', 'data', `places-${country}.json`);
}
