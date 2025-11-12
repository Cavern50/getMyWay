export const areCoordsValid = (coords: [number | null, number | null] | null): coords is [number, number] => {
    if (coords === null) return false;
    if (coords[0] === null || coords[1] === null) return false;
    return true;
}

export function copyToBuffer(text: string, cb: () => void) {
    if (!text) return
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
        cb();
    }
}


export const getQueryParameter = (key: string) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key) ?? '';
}

/**
 * Получить текущие координаты пользователя один раз
 * @param options - опции для geolocation API
 * @returns Promise с координатами [latitude, longitude] или null при ошибке
 */
export const getCurrentPosition = (
    options: PositionOptions = {}
): Promise<[number, number] | null> => {
    const {
        enableHighAccuracy = false,
        maximumAge = 60000,
        timeout = 5000
    } = options;

    return new Promise((resolve) => {
        if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
            console.error('Геолокация недоступна в этом окружении');
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                resolve([latitude, longitude]);
            },
            (error) => {
                console.error('Ошибка получения геолокации:', error.message);
                resolve(null);
            },
            { enableHighAccuracy, maximumAge, timeout }
        );
    });
}