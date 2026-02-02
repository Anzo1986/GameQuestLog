import { createApp } from 'vue'
import './global.css'
import App from './App.vue'

const app = createApp(App)

app.mount('#app')

// Remove splash screen
const splash = document.getElementById('splash-screen')
if (splash) {
    setTimeout(() => {
        splash.classList.add('loaded')
        setTimeout(() => {
            splash.remove()
        }, 500)
    }, 500) // Keep it visible for at least 500ms
}
