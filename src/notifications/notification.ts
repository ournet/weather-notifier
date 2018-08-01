
export type PushNotification = {
	lang: string
	url: string
	title: string
	content: string
	placeId: number
	iconUrl: string
}

export function getSymbolPriority(symbol: number) {
	if (symbol <= 5) {
		return 0;
	}

	// burnita
	if (symbol === 46) {
		return 0;
	}

	// fog
	if (symbol === 15) {
		return 1;
	}

	if (~[5, 9, 22].indexOf(symbol)) {
		return 0;
	}
	if (~[7, 20, 24, 23, 26, 30, 31, 40, 42, 46, 47].indexOf(symbol)) {
		return 7;
	}
	if (~[8, 21, 28, 33, 44, 49].indexOf(symbol)) {
		return 8;
	}
	if (~[10, 25, 41].indexOf(symbol)) {
		return 10;
	}
	if (~[12, 27, 32, 43, 48].indexOf(symbol)) {
		return 12;
	}
	if (~[13, 29, 45, 50].indexOf(symbol)) {
		return 13;
	}
	if (~[14, 34].indexOf(symbol)) {
		return 14;
	}

	if (symbol < 15) {
		return symbol;
	}

	return 0;
}
