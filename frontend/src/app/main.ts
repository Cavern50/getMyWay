import { createApp } from 'vue'
import App from './index.vue'
import { useQueryProvider, VueQueryPlugin } from "vue-query";
import { router } from '@/router/'
import '@/style.css'
import { createPinia } from 'pinia';
import { createYmaps } from 'vue-yandex-maps';
import { MAP_CONSTANTS } from '@/features/map/lib/constants';

useQueryProvider();
const pinia = createPinia()

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(VueQueryPlugin);
app.use(createYmaps({
    apikey: MAP_CONSTANTS.API_KEY,
}));

app.mount('#app')
