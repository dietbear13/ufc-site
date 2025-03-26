<template>
  <div class="layout-wrapper">
    <TheHeader />

    <v-main class="layout-main">
      <v-container>
        <!-- Крошки: отрисовываем только для 3+ уровня -->
        <Breadcrumbs
            v-if="visibleBreadcrumbs.length > 1"
            :breadcrumbs="visibleBreadcrumbs"
            class="mb-4"
        />

        <!-- SEO разметка крошек для любых уровней -->
        <SeoBreadcrumbs :breadcrumbs="breadcrumbs" />

        <NuxtPage />
      </v-container>
    </v-main>

    <TheFooter />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import TheHeader from '@/components/ui/TheHeader.vue'
import TheFooter from '@/components/ui/TheFooter.vue'
import Breadcrumbs from '@/components/Breadcrumbs.vue'
import SeoBreadcrumbs from '@/components/SeoBreadcrumbs.vue' // новый компонент

const route = useRoute()

// Список крошек для всех целей (SEO + UI)
const breadcrumbs = computed(() => {
  const segments = route.path.split('/').filter(Boolean)

  if (segments.length === 0) return []

  const list = segments.map((seg, index) => {
    const link = '/' + segments.slice(0, index + 1).join('/')
    const name = decodeURIComponent(seg)
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())

    return { name, link }
  })

  return list
})

// Для интерфейса — только начиная с 3 уровня
const visibleBreadcrumbs = computed(() =>
    breadcrumbs.value.length > 1 ? breadcrumbs.value : []
)
</script>

<style scoped>
.layout-main {
  height: 100%;
}
</style>