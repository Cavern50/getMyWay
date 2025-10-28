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
