import { ref, shallowRef, onMounted, onUnmounted } from 'vue';

interface UseGeolocationOptions extends PositionOptions {
    immediate?: boolean;
}

export function useGeolocationWatch(
    options: UseGeolocationOptions = {}
) {
    const {
        immediate = true,
        enableHighAccuracy = true,
        maximumAge = 0,
        timeout
    } = options;

    const coords = shallowRef<[number | null, number | null]>([null, null]);
    const error = ref<GeolocationPositionError | { code: number; message: string } | null>(null);
    const loading = ref(false);
    const watchId = ref<number | null>(null);

    const stop = () => {
        if (watchId.value !== null) {
            navigator.geolocation.clearWatch(watchId.value);
            watchId.value = null;
            loading.value = false;
        }
    };

    const start = () => {
        if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
            error.value = {
                code: 2,
                message: 'Геолокация недоступна в этом окружении'
            };
            return;
        }

        stop();
        loading.value = true;

        watchId.value = navigator.geolocation.watchPosition(
            position => {
                const { latitude, longitude } = position.coords;
                coords.value = [latitude, longitude];
                error.value = null;
                loading.value = false;
            },
            err => {
                error.value = err;
                loading.value = false;
            },
            { enableHighAccuracy, maximumAge, timeout }
        );
    };

    onMounted(() => {
        if (immediate) start();
    });

    onUnmounted(stop);

    return {
        coords,
        error,
        loading,
        start,
        stop
    };
}