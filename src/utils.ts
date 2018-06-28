
const MetnoSymbols = require('metno-symbols');

export function uniq<T>(items: T[]) {
    return items.filter((value, index, self) => self.indexOf(value) === index);
}

export function delay<T=undefined>(seconds: number, data?: T): Promise<T> {
    return new Promise<void>(resolve => setTimeout(resolve, seconds * 1000))
        .then(() => data);
}

export function getForecastSymbolName(symbol: number, lang: string): string {
    return MetnoSymbols.symbolName(symbol, lang);
}
