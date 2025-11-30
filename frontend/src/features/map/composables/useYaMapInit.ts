import { onMounted, type Ref, ref } from 'vue';
import { MapsTypes } from '../lib/types';
import { MAP_CONSTANTS } from '../lib/constants';
import { getCurrentPosition, getQueryParameter } from '@/shared/lib/helpers';

type UseYaMapInitProps = {
    mapContainer: Ref<HTMLDivElement | null>
    meetPoint: Ref<MapsTypes.MeetPoint | null>
    map: Ref<any>
    meetStep: Ref<MapsTypes.uiStep>
    onYaMapsReady: () => Promise<any>
}

export const useYaMapInit = (props: UseYaMapInitProps) => {
    const { mapContainer, meetPoint, meetStep, map } = props
    onMounted(async () => {
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


                const userCoords = await getCurrentPosition();
                const controls = getQueryParameter('meetLink') ? [] : [inputSearch];


                map.value = new yaMaps.Map(mapContainer.value, {
                    center: userCoords,
                    zoom: 10,
                    controls,
                })

                props.onYaMapsReady();

                // Сохраняем выбранную точку из поиска
                inputSearch.events.add('resultselect', (e: any) => {
                    const index = e.get('index')
                    inputSearch.getResult(index).then(async (res: any) => {
                        const coords = res.geometry.getCoordinates()
                        meetPoint.value = {
                            coords: coords as MapsTypes.Coords,
                            name: res.properties._data.name
                        }
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