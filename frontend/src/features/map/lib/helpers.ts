import { type Ref } from 'vue';
import { meetingApi, type Meeting } from '../api/meetingApi';
import type { MapsTypes } from './types';

export const mapHelpers = {
    addUserFromInputs,
} as const;

function addUserFromInputs({ map, meetPoint, userPoint, routes }: { map: any, meetPoint: [number, number], userPoint: [number, number], routes: any[] }) {
    // Создание маршрута
    // yaMaps недоступен здесь, поэтому используем API существующей карты
    // Создадим MultiRoute через глобальный ymaps
    // @ts-ignore
    const ya = (window as any).ymaps;
    if (!ya || !map) return;
    const route = new ya.multiRouter.MultiRoute({
        referencePoints: [userPoint, meetPoint],
        params: { routingMode: 'auto', results: 1 }
    }, {
        wayPointStartIconColor: "black",
        wayPointStartIconFillColor: "transparent",
        wayPointStartIconImageSize: [32, 32],
        wayPointStartIconImageOffset: [-16, -16],
        routeActiveStrokeStyle: 'solid',
        routeActiveStrokeColor: "#002233",
        routeStrokeStyle: 'dot',
        routeStrokeWidth: 3,
        boundsAutoApply: true,
    });
    map.geoObjects.add(route);
    route.events.add('update', () => {
        const wayPoints = route.getWayPoints();
        wayPoints.each((point: any, index: number) => {
            const isStart = index === 0;
            point.properties.set({
                balloonContentHeader: isStart ? 'Старт' : 'Финиш',
                balloonContentBody: isStart ? 'Точка отправления' : 'Точка назначения',
                balloonContentFooter: '',
                hintContent: isStart ? 'Начало маршрута' : 'Конец маршрута',
            });
            if (isStart) {
                point.options.set({ preset: 'islands#blueCircleIcon', iconColor: '#2B65D9' })
                point.properties.set({ iconCaption: 'Пользователь' })
            } else {
                point.options.set({ preset: 'islands#redIcon', iconColor: '#D23C3C', hasBalloon: true, hideIconOnBalloonOpen: false });
                point.properties.set({ iconCaption: 'Точка встречи' })
            }
        });
    });
    routes.push(route);
}

// Загрузка встречи по URL
export const setMeetingPlacemark = ({ meeting, map }: { meeting: Meeting, map: Ref<any> }) => {
    const yaMaps = (window as any).ymaps

    if (!map || !yaMaps) return

    const meetPlacemark = new yaMaps.Placemark(
        meeting.location.coordinates,
        { iconCaption: meeting.title },
        { preset: 'islands#redCircleIcon' }
    )
    map.value.geoObjects.add(meetPlacemark)

}


// Обновление маршрута пользователя
// coords должны быть в формате Yandex Maps: [lat, lon]
export const updateUserRoute = async ({ coords, map, userRoute }: { coords: MapsTypes.Coords | null, map: Ref<any>, userRoute: any }) => {
    const yaMaps = (window as any).ymaps
    if (!yaMaps || !map || coords === null) return

    yaMaps.geolocation.get({ provider: 'browser', mapStateAutoApply: false }).then((geoRes: any) => {
        // userCoords уже в формате [lat, lon] от Yandex Maps
        const userCoords = geoRes.geoObjects.get(0).geometry.getCoordinates()

        if (userRoute) {
            try {
                map.value.geoObjects.remove(userRoute)
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
            routeIconCaption: 'Мой маршрут',
            boundsAutoApply: true,
        })

        map.value.geoObjects.add(userRoute)
    }).catch((error: Error) => { console.error(error) })
}

// Присоединение к встрече по ссылке
export const joinMeetingByLink = async ({ link, currentMeeting, meetPoint, map }: { link: string, currentMeeting: Ref<Meeting>, meetPoint: Ref<MapsTypes.Coords>, map: Ref<any> }) => {
    try {
        const meeting = await meetingApi.getMeetingByLink(link)
        currentMeeting.value = meeting

        if (meeting.location?.coordinates) {
            const [lon, lat] = meeting.location.coordinates
            meetPoint.value = [lon, lat] as MapsTypes.Coords

            const yaMaps = (window as any).ymaps;

            if (yaMaps && map) {
                // Yandex Maps использует формат [lat, lon]
                const yandexCoords: MapsTypes.Coords = [lat, lon]
                // if (!meetPlacemark.value) {
                //     meetPlacemark.value = new yaMaps.Placemark(
                //         yandexCoords,
                //         { iconCaption: meeting.title || 'Точка встречи' },
                //         { preset: 'islands#redCircleIcon' }
                //     )
                //     map.value.geoObjects.add(meetPlacemark.value)
                // }
                map.value.setCenter(yandexCoords, 15)
                // updateUserRoute({coords: yandexCoords, map: map, userRoute: userRoute.value }); 
            }
        }

        // Подключаемся к WebSocket
        // TODO: 
        // connect()
        // joinMeeting(meeting.meetingLink)

        // // Начинаем отслеживание позиции
        // startLocationTracking()
    } catch (error) {
        console.error('Error joining meeting:', error)
        alert('Ошибка при присоединении к встрече')
    }
}

export const addRoute = ({ coords, map }: { coords: { start: [number, number], finish: [number, number] }, map: any }) => {
    if (!map.value) return
    //@ts-ignore
    const { multiRouter } = window.ymaps
    const route = new multiRouter.MultiRoute(
        {
            referencePoints: [coords.start, coords.finish],
            params: { routingMode: 'pedestrian', results: 1 },
        },
        {
            wayPointStartVisible: false,
            wayPointFinishVisible: false,
        },
    );

    map.value.geoObjects.add(route)
    return route;
}
