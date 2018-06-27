
export function uniq<T>(items: T[]) {
    return items.filter((value, index, self) => self.indexOf(value) === index);
}

export function delay<T=undefined>(seconds: number, data?: T): Promise<T> {
    return new Promise<void>(resolve => setTimeout(resolve, seconds * 1000))
        .then(() => data);
}
