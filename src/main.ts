import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/main.scss'
import App from './App.vue'
import router from './router'
import { getTheme, setThemeOnDocument } from './composables/useTheme'

// Apply theme before first paint so landing/login/customer portal match employee portal
setThemeOnDocument(getTheme())

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')
