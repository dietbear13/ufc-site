import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
export default defineNuxtConfig({
  ssr: true,  // Включаем SSR
  srcDir: '.', // исходная директория (если нужен custom)
  app: {
    head: {
      titleTemplate: '%s - MMA World',  // шаблон заголовка страниц
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#EF4444' }  // цвет темы (например, красный UFC)
      ],
      link: [
        // Подключаем шрифт (например, Oswald для заголовков в стиле UFC)
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap' }
      ]
    }
  },
  css: [
    'vuetify/lib/styles/main.sass',
    '@mdi/font/css/materialdesignicons.css'
  ],
  build: {
    transpile: ['vuetify'],
  },
  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
    //...
  ],

  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
    ssr: {
      noExternal: ['vuetify']
    },
  },

  compatibilityDate: '2025-03-26',
})