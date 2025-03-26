<template>
  <v-app>
    <!-- Шапка / Header -->
    <v-app-bar color="white" flat app>
      <!-- Бургер-иконка для мобильного меню -->
      <v-app-bar-nav-icon class="mr-3" @click="drawer = !drawer" />
      <!-- Логотип/название сайта -->
      <NuxtLink to="/" class="text-xl font-bold mr-5">MMA World</NuxtLink>
      <!-- Горизонтальное меню (скрыто на мобильных) -->
      <div class="hidden sm:flex space-x-4">
        <NuxtLink v-for="link in links" :key="link.to" :to="link.to" class="hover:text-primary">
          {{ link.name }}
        </NuxtLink>
      </div>
      <v-spacer></v-spacer>
    </v-app-bar>

    <!-- Боковое выдвижное меню для мобильных -->
    <v-navigation-drawer v-model="drawer" app temporary>
      <v-list>
        <v-list-item v-for="link in links" :key="link.to">
          <NuxtLink :to="link.to" @click="drawer = false">{{ link.name }}</NuxtLink>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Основной контент страницы -->
    <v-main class="px-4 py-6">
      <NuxtPage />  <!-- здесь рендерится контент текущей страницы -->
    </v-main>

    <!-- Футер (простой пример) -->
    <v-footer app color="grey lighten-3" class="pa-4">
      <span class="text-sm">© 2025 MMA World – Неофициальный фан-сайт UFC</span>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">

const drawer = ref(false);
const links = [
  { name: 'Главная', to: '/' },
  { name: 'Бойцы', to: '/fighters' },
  { name: 'Турниры', to: '/events' },
  { name: 'Блог', to: '/blog' },
  { name: 'О нас', to: '/about' },
  { name: 'Контакты', to: '/contact' }
];
</script>
