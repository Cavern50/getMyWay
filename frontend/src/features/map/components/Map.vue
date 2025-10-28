<script setup lang="ts">
import { onMounted, ref, watchEffect } from 'vue'
import { mapConstants } from '../lib/constants'
import { MapsTypes } from '../lib/types'
import { Alert } from '@/shared/ui';
const mapContainer = ref<HTMLDivElement | null>(null)
let map: any = null
let routes: any[] = []

const meetStep = ref<MapsTypes.uiStep>(MapsTypes.uiStep.FIND_MEET_POINT);
const meetPoint = ref<[number, number] | null>(null)
const meetingLink = ref<string>('')
const isCopiedAlertVisible = ref<boolean>(false);

let meetPlacemark: any = null
let userRoute: any = null

const API_KEY = 'a5030637-33a6-4eb7-b1e9-a9153f7c0884';
// Текущая целевая точка (обновляется из поиска)


onMounted(() => {
    if (!mapContainer.value) return
    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${API_KEY}&lang=ru_RU`
    script.onload = () => {

        // @ts-ignore
        const yaMaps = ymaps as any;



        yaMaps.ready(async () => {
            var inputSearch = new yaMaps.control.SearchControl({
                options: {
                    // Пусть элемент управления будет
                    // в виде поисковой строки.
                    size: 'large',
                    // Включим возможность искать
                    // не только топонимы, но и организации.
                    provider: 'yandex#search'
                }
            })

            map = new yaMaps.Map(mapContainer.value, {
                center: [59.9386, 30.3141],
                zoom: 10,
                controls: [inputSearch],
            });
            const { geoObjects: { position } } = await yaMaps.geolocation.get({
                provider: 'browser',
                mapStateAutoApply: true
            });
            map.setCenter(position)
            // Сохраняем выбранную точку из поиска в meetPoint, добавляем метку и строим маршрут от геопозиции
            inputSearch.events.add('resultselect', (e: any) => {
                const index = e.get('index');
                inputSearch.getResult(index).then((res: any) => {
                    const coords = res.geometry.getCoordinates();
                    meetPoint.value = coords as [number, number];

                    // Добавляем/обновляем метку точки встречи
                    if (!meetPlacemark) {
                        meetPlacemark = new yaMaps.Placemark(coords, { iconCaption: res.properties._data.name ?? 'Точка встречи' }, {
                            preset: 'islands#redCircleIcon',
                        });
                        meetStep.value = MapsTypes.uiStep.CREATE_MEETING_LINK;
                        map.geoObjects.add(meetPlacemark);
                    } else {
                        meetPlacemark.geometry.setCoordinates(coords);
                    }

                    // Строим маршрут от текущей геопозиции пользователя до выбранной точки 
                    yaMaps.geolocation.get({ provider: 'browser', mapStateAutoApply: false }).then((geoRes: any) => {
                        const userCoords = geoRes.geoObjects.get(0).geometry.getCoordinates();

                        if (userRoute) {
                            try {
                                map.geoObjects.remove(userRoute);

                            } catch (_) { }
                        }

                        userRoute = new yaMaps.multiRouter.MultiRoute({
                            referencePoints: [userCoords, coords],
                            params: { routingMode: 'auto', results: 1 }
                        }, {
                            routeActiveStrokeStyle: 'solid',
                            routeActiveStrokeColor: '#002233',
                            routeStrokeStyle: 'dot',
                            routeStrokeWidth: 3,
                            routeIconCaption: 'Маршрут',
                            boundsAutoApply: true,
                        });

                        map.geoObjects.add(userRoute);
                        routes.push(userRoute);
                    }).catch(() => { });

                    // Убираем поиск с карты после выбора точки
                    try { map.controls.remove(inputSearch); } catch (_) { }

                    if (routes) {
                        routes.forEach((route: any) => {
                            const refPoints = route.model.getReferencePoints();
                            route.model.setReferencePoints([refPoints[0], coords]);
                        });
                    }
                });
            });
        })
    }
    document.head.appendChild(script)
})




watchEffect(() => {
    if (meetPoint.value) {
        routes.forEach((route: any) => {
            if (!route) return;
            route.model.setReferencePoints([route.model.getReferencePoints()[0], meetPoint.value]);
        });
    }
});

function createMeetingLink() {
    if (!meetPoint.value) return;
    const [lat, lon] = meetPoint.value;
    const url = `${window.location.origin}${window.location.pathname}?meet=${lat},${lon}`;
    meetingLink.value = url;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).catch(() => { });
    }
    meetStep.value = MapsTypes.uiStep.COMPLETE;
}

function copyMeetingLink() {
    if (!meetingLink.value) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(meetingLink.value).catch(() => { });
        isCopiedAlertVisible.value = true;
        setTimeout(() => {
            isCopiedAlertVisible.value = false;
        }, 3000);
    }
}

</script>

<template>
    <div class="p-4 h-screen">
        <div ref="mapContainer" style="width: 100%; height: 50vh;"></div>
        <div class="mt-4 w-64 space-y-2">
            <ul class="ml-6 text-m font-medium list-decimal">
                <li v-for="item in mapConstants.LIST_ITEMS" :key="item.id"
                    :class="meetStep === item.step ? 'list-item' : 'list-item opacity-10'">
                    {{ item.name }}</li>
            </ul>
            <div v-if="meetStep === MapsTypes.uiStep.CREATE_MEETING_LINK">
                <button type="button" class="btn btn-primary w-full" @click="createMeetingLink">Создать ссылку на
                    встречу</button>
            </div>
            <div v-if="meetStep === MapsTypes.uiStep.COMPLETE && meetingLink"
                class="text-xs mt-4 underline cursor-pointer select-all" @click="copyMeetingLink"
                title="Нажмите, чтобы скопировать">
                {{ meetingLink }}
            </div>
            <Alert :show="isCopiedAlertVisible" type="success" message="Ссылка на встречу скопирована в буфер обмена" />
        </div>
    </div>
</template>