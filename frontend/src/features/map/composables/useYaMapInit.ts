import { onMounted, type Ref, ref } from 'vue';
import { useRoute } from 'vue-router';
import { MapsTypes } from '../lib/types';
import { MAP_CONSTANTS } from '../lib/constants';

type UseYaMapInitProps = {
    mapContainer: Ref<HTMLDivElement | null>
    meetPoint: Ref<[number, number] | null>
    map: Ref<any>
    meetStep: Ref<MapsTypes.uiStep>
    onYaMapsReady: () => Promise<any>
}

export const useYaMapInit = (props: UseYaMapInitProps) => {
    const { mapContainer, meetPoint, meetStep, map } = props
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

                console.log(props)

                props.onYaMapsReady();

                // Сохраняем выбранную точку из поиска
                inputSearch.events.add('resultselect', (e: any) => {
                    const index = e.get('index')
                    inputSearch.getResult(index).then(async (res: any) => {
                        const coords = res.geometry.getCoordinates()
                        meetPoint.value = coords as MapsTypes.Coords
                        meetStep.value = MapsTypes.uiStep.CREATE_MEETING_LINK;

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