<template>
  <nav class="breadcrumbs" aria-label="Хлебные крошки">
    <v-row align="center" no-gutters class="flex-nowrap">
      <template v-for="(crumb, index) in breadcrumbsComputed" :key="index">
        <!-- Разделитель (иконка) — показываем начиная со второго элемента -->
        <v-icon
            v-if="index !== 0"
            class="mx-2"
            color="grey-darken-1"
            size="18"
        >
          mdi-chevron-right
        </v-icon>

        <!-- Последний пункт — неактивный (текущая страница) -->
        <span
            v-if="index === breadcrumbsComputed.length - 1"
            class="breadcrumb-current"
        >
          {{ crumb.name }}
        </span>

        <!-- Все предыдущие пункты — кликабельные ссылки -->
        <span v-else>
          <NuxtLink :to="crumb.link" class="breadcrumb-link">
            {{ crumb.name }}
          </NuxtLink>
        </span>
      </template>
    </v-row>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from '#imports'

// Пример: данные о бойцах и турнирах (замените на ваши источники).
import fightersData from '~/assets/mock/fighters.json'
import eventsData from '~/assets/mock/events.json'

// Отображение второго уровня на кириллице:
const pathMap: Record<string, string> = {
  fighters: 'Бойцы',
  events: 'Турниры',
  blog: 'Новости'
}

const route = useRoute()

// Сегменты пути ("/fighters/danny_abbadi" → ["fighters", "danny_abbadi"])
const segments = computed(() => route.path.split('/').filter(Boolean))

// Формируем хлебные крошки
const breadcrumbsComputed = computed(() => {
  const crumbs: Array<{ name: string; link?: string }> = []

  // 2) Второй уровень (fighters / events / blog)
  if (segments.value[0] && pathMap[segments.value[0]]) {
    crumbs.push({
      name: pathMap[segments.value[0]],
      link: `/${segments.value[0]}`
    })
  }

  // 3) Третий уровень (slug бойца / турнира / статьи и т.д.)
  if (segments.value.length > 1) {
    const slug = segments.value[1]
    const section = segments.value[0]
    let entityName = slug // fallback, если не найдём

    // Для бойцов
    if (section === 'fighters') {
      const fighter = (fightersData as any[]).find(f => f.slug === slug)
      if (fighter) entityName = fighter.name
    }
    // Для турниров
    else if (section === 'events') {
      const eventItem = (eventsData as any[]).find(e => e.slug === slug)
      if (eventItem) entityName = eventItem.name
    }
    // Аналогично — если нужен blog, categories и т.п.

    crumbs.push({
      name: entityName
      // link не указываем, т.к. это текущая страница
    })
  }

  return crumbs
})
</script>

<style scoped>
.breadcrumbs {
  font-size: 15px;
  white-space: nowrap;
  overflow-x: auto;
  padding-block: 4px;
}

.breadcrumb-link {
  color: #1976d2;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: #1565c0;
  text-decoration: underline;
}

.breadcrumb-current {
  font-weight: 600;
  color: #424242;
}
</style>
