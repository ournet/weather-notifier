
//http://www.unicode.org/cldr/charts/33/supplemental/day_periods.html

const DATA: { [lang: string]: [{ name: string, in_name?: string, from: number, to: number }] }
    = require('../data/day-periods.json');

export function getDayPeriodName(hour: number, lang: string): string {
    const item = DATA[lang].find(item => item.from <= hour && item.to > hour);
    return item.in_name || item.name;
}
