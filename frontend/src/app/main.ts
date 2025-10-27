import { createApp } from 'vue'
import App from './index.vue'
import { useQueryProvider, VueQueryPlugin } from "vue-query";
import { router } from '@/router/'
import '@/style.css'
import { createPinia } from 'pinia';

useQueryProvider();
const pinia = createPinia()

const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(VueQueryPlugin);
app.mount('#app')
