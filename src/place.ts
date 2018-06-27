
export function getPlaceName(place: Place, lang: string) {
    const name = place.names ?
        parseNames(place.names || '').find(item => item.lang === lang)
        : null;
    if (name && name.name) {
        return name.name;
    }
    return place.name;
}

function parseNames(names: string): { name: string, lang: string }[] {
    return names.split(/\|/g).map(name => parseName(name));
}

function parseName(name: string): { name: string, lang: string } {
    if (!/\[[a-z]{2}\]$/.test(name)) {
        throw new Error(`'name' is invalid`);
    }
    return {
        name: name.substr(0, name.length - 4),
        lang: name.substr(name.length - 3, 2)
    };
}

export type PlaceFeatureClassType = 'A' | 'H' | 'L' | 'P' | 'R' | 'S' | 'T' | 'U' | 'V';

export interface Place {
    id: number
    name?: string
    asciiname?: string
    names?: string
    latitude?: number
    longitude?: number
    featureClass?: PlaceFeatureClassType
    featureCode?: string
    countryCode?: string
    admin1Code?: string
    admin2Code?: string
    admin3Code?: string
    population?: number
    timezone?: string

    wikiId?: string
    // wiki?: IPlaceWiki
    admin1?: Place
}
