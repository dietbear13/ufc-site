import '@mdi/font/css/materialdesignicons.css'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

const myTheme = {
    dark: false,
    colors: {
        primary: '#EF4444',    // красный (основной цвет UFC)
        secondary: '#1F2937',  // темно-серый/черный для текста
        surface: '#FFFFFF',
        background: '#F3F4F6', // светло-серый фон приложения
        success: '#16A34A',    // зеленый (например, для побед)
        error: '#DC2626'       // красный (для ошибок/проигрышей)
        // ... можно определить дополнительные цвета (warning, info и др.)
    }
};


export default defineNuxtPlugin((app) => {
    const vuetify = createVuetify({
        ssr: true,
        components,
        directives,
        theme: {
            defaultTheme: 'myTheme',
            themes: { myTheme }
        },
        icons: {
            defaultSet: 'mdi'  // используем Material Design Icons
        }
    })
    app.vueApp.use(vuetify)
})
