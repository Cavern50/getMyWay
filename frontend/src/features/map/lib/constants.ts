import { MapsTypes } from "./types";

export const mapConstants = {
    API_KEY: 'a5030637-33a6-4eb7-b1e9-a9153f7c0884',
    LIST_ITEMS: [
        {
            id: 1,
            step: MapsTypes.uiStep.FIND_MEET_POINT,
            name: 'Найдите точку встречи через поиск на карте.',
        },
        {
            id: 2,
            step: MapsTypes.uiStep.CREATE_MEETING_LINK,
            name: 'Нажмите на кнопку "Создать ссылку на встречу", чтобы создать ссылку на встречу.',
        },
        {
            id: 3,
            step: MapsTypes.uiStep.COMPLETE,
            name: 'Готово! Можете отправлять ссылку на встречу всем участникам.',
        },
    ],
} as const;

