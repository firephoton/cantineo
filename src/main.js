import './style.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const mountApp = () => {
  createApp(App).use(router).mount('#app')
}

// En développement (navigateur), monter directement
if (window.cordova) {
  document.addEventListener('deviceready', mountApp, false)
} else {
  mountApp()
}