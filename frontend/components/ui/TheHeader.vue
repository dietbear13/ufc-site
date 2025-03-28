<template>
  <v-app-bar height="64">
    <v-container fluid>
      <v-row align="center" justify="space-between" no-gutters>
        <!-- Левая часть: логотип -->
        <v-col cols="auto">
          <NuxtLink to="/" class="text-h5 font-weight-bold text-red-darken-2">
            MMA<span class="text-black">World</span>
          </NuxtLink>
        </v-col>

        <!-- Правая часть (desktop) -->
        <v-col cols="auto" v-if="mdAndUp">
          <v-row align="center" no-gutters class="gap-3">
            <v-btn
                v-for="(item, i) in menuItems"
                :key="i"
                :to="item.link"
                variant="text"
                class="text-button"
            >
              {{ item.title }}
            </v-btn>
          </v-row>
        </v-col>

        <!-- Бургер (mobile) -->
        <v-col cols="auto" v-if="smAndDown">
          <v-btn icon variant="text" @click="drawer = !drawer">
            <v-icon>mdi-menu</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-app-bar>

  <!-- Drawer справа -->
  <v-navigation-drawer
      v-model="drawer"
      location="end"
      temporary
  >
    <v-list>
      <v-list-item
          v-for="(item, i) in menuItems"
          :key="i"
          @click="goTo(item.link)"
      >
        <v-list-item-title>{{ item.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDisplay } from 'vuetify'

// Массив пунктов меню
const menuItems = [
  { title: 'Бойцы', link: '/fighters' },
  { title: 'Турниры', link: '/events' },
  { title: 'Новости', link: '/blog' }
]

// Реф для управления Drawer
const drawer = ref(false)

// useDisplay из Vuetify даёт реактивные флаги:
const { smAndDown, mdAndUp } = useDisplay()

function goTo(link: string) {
  drawer.value = false
  // Если нужно программно переходить: useRouter().push(link)
  // Или можно обернуть <v-list-item> в <NuxtLink> напрямую
}
</script>

<style scoped>
.text-button {
  font-weight: 500;
  color: #424242;
  text-transform: none;
}
.text-button:hover {
  background-color: rgba(0,0,0,0.04);
}
</style>
