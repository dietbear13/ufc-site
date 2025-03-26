<template>
  <v-container v-if="event">
    <!-- Заголовок и дата -->
    <v-row>
      <v-col cols="12" class="text-center">
        <h1 class="text-h4 font-weight-bold mb-2">{{ event.name }}</h1>
        <p class="text-subtitle-1 text-grey-darken-1">
          <v-icon icon="mdi-calendar" size="18" class="mr-1" />
          {{ formattedDate }}
          <span class="mx-2">•</span>
          <v-icon icon="mdi-map-marker" size="18" class="mr-1" />
          {{ event.location }}
        </p>
      </v-col>
    </v-row>

    <!-- Постер турнира -->
    <v-row>
      <v-col cols="12" md="8" class="mx-auto">
        <v-img
            :src="event.poster"
            height="400"
            cover
            class="rounded-lg"
        />
      </v-col>
    </v-row>

    <!-- Основной кард -->
    <v-row class="mt-10">
      <v-col cols="12">
        <h2 class="text-h5 font-weight-medium mb-4">Основной кард</h2>

        <v-table>
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
            <td>{{ fight.fighter1 }}</td>
            <td class="text-center">⚔</td>
            <td>{{ fight.fighter2 }}</td>
            <td>{{ fight.result || 'TBD' }}</td>
          </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>

    <!-- Кнопка назад -->
    <v-row class="mt-8">
      <v-col cols="12" class="text-center">
        <v-btn
            color="primary"
            prepend-icon="mdi-arrow-left"
            :to="'/events'"
            variant="text"
        >
          Назад ко всем турнирам
        </v-btn>
      </v-col>
    </v-row>
  </v-container>

  <!-- Лоадер -->
  <v-container v-else>
    <v-row>
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary" size="48" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useEvents } from '@/composables/useEvents.js'

const route = useRoute()
const { events, loadEvents } = useEvents()
const event = ref(null)

await loadEvents()

event.value = events.value.find(
    (e) => e.slug === route.params.slug
)

const formattedDate = computed(() => {
  if (!event.value) return ''
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(event.value.date).toLocaleDateString('ru-RU', options)
})
</script>
