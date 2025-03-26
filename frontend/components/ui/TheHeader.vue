<template>
  <v-app-bar
      app
      color="white"
      flat
      class="border-b"
  >
    <v-container class="d-flex align-center justify-space-between">
      <!-- Лого -->
      <NuxtLink to="/" class="text-h5 font-weight-bold text-red-darken-2">
        MMA<span class="text-black">World</span>
      </NuxtLink>

      <!-- Навигация (desktop) -->
      <div class="d-none d-md-flex align-center gap-4">
        <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="text-body-1 font-medium hover:text-primary"
            :class="{ 'text-primary': route.path.startsWith(link.to) }"
        >
          {{ link.name }}
        </NuxtLink>
      </div>

      <!-- Меню для мобильных -->
      <v-menu
          class="d-md-none"
          offset-y
          transition="slide-y-transition"
      >
        <template #activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-menu</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
              v-for="link in links"
              :key="link.to"
              :to="link.to"
              @click="closeMenu"
          >
            <NuxtLink
                :to="link.to"
              class="mx-2"
            >{{ link.name }}</NuxtLink>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-container>
  </v-app-bar>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const links = [
  { name: 'Бойцы', to: '/fighters' },
  { name: 'Турниры', to: '/events' },
  { name: 'Блог', to: '/blog' },
]

const closeMenu = () => {} // заглушка для закрытия при необходимости
</script>

<style scoped>
.border-b {
  border-bottom: 1px solid #eee;
}
</style>
