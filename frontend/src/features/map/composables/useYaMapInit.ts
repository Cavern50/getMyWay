import { onMounted, type Ref, ref } from 'vue';
import { useRoute } from 'vue-router';
import { MapsTypes } from '../lib/types';
import { MAP_CONSTANTS } from '../lib/constants';

type UseYaMapInitProps = {
    mapContainer: Ref<HTMLDivElement | null>
    meetPoint: Ref<[number, number] | null>
    map: Ref<any>
    meetStep: Ref<MapsTypes.uiStep>
    onResultSelect: () => void;
    onInit: () => Promise<void>;
}

export const useYaMapInit = (props: UseYaMapInitProps) => {
    const meetPlacemark = ref<any>(null)

    const { mapContainer, meetPoint, map, meetStep, onInit, onResultSelect } = props
    const route = useRoute()

    onMounted(async () => {
        const meetParam = route.query.meet as string
        if (meetParam) {
            const coords = meetParam.split(',').map(Number)
            const lat = coords[0]
            const lon = coords[1]
            if (lat !== undefined && lon !== undefined && !isNaN(lat) && !isNaN(lon)) {
                meetPoint.value = [lon, lat] as MapsTypes.Coords;
            }
        }

        if (!mapContainer.value) return

        const script = document.createElement('script')
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=${MAP_CONSTANTS.API_KEY}&lang=ru_RU`;
        document.head.appendChild(script)
        script.onload = () => {
            // @ts-ignore
            const yaMaps = window.ymaps as any

            yaMaps.ready(async () => {
                var inputSearch = new yaMaps.control.SearchControl({
                    options: {
                        size: 'large',
                        provider: 'yandex#search'
                    }
                })

                map.value = new yaMaps.Map(mapContainer.value, {
                    center: [59.9386, 30.3141],
                    zoom: 10,
                    controls: [inputSearch],
                })

                // Убрать mapStateAutoApply или убрать setCenter - не дублировать
                const { geoObjects: { position } } = await yaMaps.geolocation.get({
                    provider: 'browser',
                    mapStateAutoApply: false  // Изменить на false
                })

                // Дождаться готовности карты перед setCenter
                await new Promise<void>((resolve) => {
                    map.value.events.once('idle', () => resolve())
                    map.value.setCenter(position)
                    // Если карта уже idle, разрешить сразу
                    setTimeout(() => resolve(), 100)
                })

                // Если есть точка встречи из URL, загружаем встречу
                if (meetPoint.value) {
                    // await onInit();
                    // await loadMeetingFromUrl({coords: meetPoint.value, map: map, meetPlacemark: meetPlacemark.value})
                }

                // Сохраняем выбранную точку из поиска
                inputSearch.events.add('resultselect', (e: any) => {
                    const index = e.get('index')
                    inputSearch.getResult(index).then(async (res: any) => {
                        const coords = res.geometry.getCoordinates()
                        meetPoint.value = coords as MapsTypes.Coords

                        const localPlacemark = new yaMaps.Placemark(
                            coords,
                            { iconCaption: res.properties._data.name ?? 'Точка встречи' },
                            { preset: 'islands#redCircleIcon' }
                        )
                        meetPlacemark.value = localPlacemark;
                        meetStep.value = MapsTypes.uiStep.CREATE_MEETING_LINK;

                        // Дождаться, пока карта завершит все операции
                        await new Promise<void>((resolve) => {
                            const addPlacemark = () => {
                                try {
                                    if (map.value && !map.value.destroyed) {
                                        // Удалить старую метку, если есть
                                        if (meetPlacemark.value && map.value.geoObjects.getLength() > 0) {
                                            try {
                                                map.value.geoObjects.remove(meetPlacemark.value)
                                            } catch (_) { }
                                        }
                                        // Добавить новую метку
                                        map.value.geoObjects.add(localPlacemark)
                                    }
                                } catch (e) {
                                    console.error('Error adding placemark:', e)
                                }
                                map.value.events.remove('idle', addPlacemark)
                                resolve()
                            }
                            console.log(map.value.events)
                            // Подписаться на событие idle
                            map.value.events.once('idle', addPlacemark)
                            // Если карта уже idle, добавить сразу
                            setTimeout(() => {
                                if (map.value.events.get('idle')) {
                                    addPlacemark()
                                }
                            }, 50)
                        })

                        // Строим маршрут от текущей геопозиции пользователя до выбранной точки
                        onResultSelect();

                        try {
                            map.value.controls.remove(inputSearch)
                        } catch (e) {
                            console.warn('Error removing search control:', e)
                        }
                    })
                })
            })
        }
    })
}