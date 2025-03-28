<template>
  <v-container v-if="event">
    <v-row align="center" class="mb-6">
      <v-col cols="12" md="3" class="text-center text-md-start">
        <v-img
            :src="imageSrc"
            height="120"
            width="280"
            cover
            aspect-ratio="16:9"
            class="tournament-logo"
            @error="onImageError"
        />
      </v-col>
      <v-col cols="12" md="9">
        <h1 class="text-h4 font-weight-bold mb-1">{{ event.name }}</h1>
        <p class="text-subtitle-1 text-grey-darken-1 mb-2">
          <v-icon icon="mdi-calendar" size="18" class="mr-1" />
          {{ formattedDate }}
          <span class="mx-2">•</span>
          <v-icon icon="mdi-map-marker" size="18" class="mr-1" />
          {{ event.location }}
        </p>
      </v-col>
    </v-row>

    <!-- Main Card -->
    <v-sheet rounded="lg" elevation="1" class="pa-4">
      <h2 class="text-h6 font-weight-bold mb-4">Основной кард</h2>
      <v-table density="compact">
        <thead>
        <tr>
          <th>Боец 1</th>
          <th class="text-center">vs</th>
          <th>Боец 2</th>
          <th>Результат</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(fight, index) in event.main_card" :key="index">
          <td>
            <template v-if="fight.fighter1_slug">
              <NuxtLink :to="'/fighters/' + fight.fighter1_slug">{{ fight.fighter1 }}</NuxtLink>
            </template>
            <template v-else>{{ fight.fighter1 }}</template>
          </td>
          <td class="text-center">⚔</td>
          <td>
            <template v-if="fight.fighter2_slug">
              <NuxtLink :to="'/fighters/' + fight.fighter2_slug">{{ fight.fighter2 }}</NuxtLink>
            </template>
            <template v-else>{{ fight.fighter2 }}</template>
          </td>
          <td>{{ fight.result || 'TBD' }}</td>
        </tr>
        </tbody>
      </v-table>
    </v-sheet>

    <!-- Prelims -->
    <v-sheet
        v-if="event.prelims_card && event.prelims_card.length"
        rounded="lg"
        elevation="1"
        class="pa-4 mt-6"
    >
      <h2 class="text-h6 font-weight-bold mb-4">Прелимы</h2>
      <v-table density="compact">
        <thead>
        <tr>
          <th>Боец 1</th>
          <th class="text-center">vs</th>
          <th>Боец 2</th>
          <th>Результат</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(fight, idx) in event.prelims_card" :key="idx">
          <td>
            <template v-if="fight.fighter1_slug">
              <NuxtLink :to="'/fighters/' + fight.fighter1_slug">{{ fight.fighter1 }}</NuxtLink>
            </template>
            <template v-else>{{ fight.fighter1 }}</template>
          </td>
          <td class="text-center">⚔</td>
          <td>
            <template v-if="fight.fighter2_slug">
              <NuxtLink :to="'/fighters/' + fight.fighter2_slug">{{ fight.fighter2 }}</NuxtLink>
            </template>
            <template v-else>{{ fight.fighter2 }}</template>
          </td>
          <td>{{ fight.result || 'TBD' }}</td>
        </tr>
        </tbody>
      </v-table>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useSeoHead } from '../../composables/useSeoHead'
import { useSeoSchemaBuilder } from '../../composables/useSeoSchemaBuilder'
import { useApi } from '../../composables/useApi'


// ✅ Запрашиваем один турнир по slug через API
const { data: events } = await useAsyncData('events', () =>
    useApi('/events', {
      lazy: false,
      cacheKey: 'events',
      transform: (data) => data.events || data
    }).refresh()
)

const route = useRoute()
const event = ref(null)

event.value = events.value.find(f => f.slug === route.params.slug)

watchEffect(() => {
  if (event.value) {
    useSeoSchemaBuilder('event', event.value)
    useSeoHead({
      title: event.value.name,
      canonical: `http://localhost:3000/events/${event.value.slug}`
    })
  }
})

// if (!event.value) {
//   throw createError({ statusCode: 404, statusMessage: 'Турнир не найден' })
// }

// SEO
useSeoSchemaBuilder('event', event.value)
useSeoHead({
  title: `Турнир ${event.value.name} — расписание и кард бойцов`,
  description: `Смотри расписание и кард турнира ${event.value.name} – все подробности, участники и результаты.`,
  canonical: `http://localhost:3000/events/${event.value.slug}`
})

const defaultPoster = '/images/tournament_default.png'
const imageSrc = ref(event.value?.poster || defaultPoster)

const onImageError = () => {
  imageSrc.value = defaultPoster
}

const formattedDate = computed(() => {
  if (!event.value) return ''
  return new Date(event.value.date).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})
</script>

<style scoped>
.tournament-logo {
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
</style>
