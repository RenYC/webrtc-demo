import './assets/css/main.css'
import 'normalize.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'default-passive-events'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.provide('$serverSocketUrl', 'ws://127.0.0.1:18080')

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
