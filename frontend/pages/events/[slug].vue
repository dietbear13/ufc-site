<template>
  <v-container v-if="event">
    <v-img
        :src="event.poster"
        height="400"
        cover
        class="rounded-lg mb-6"
    />

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
  </v-container>
</template>

<script setup>
import { useEvents } from '../../composables/useEvents'
import { useRoute } from 'vue-router'
import { useSeoSchemaBuilder } from '../../composables/useSeoSchemaBuilder'

const route = useRoute()
const { events, loadEvents } = useEvents()
const event = ref(null)

await loadEvents()
event.value = events.value.find(e => e.slug === route.params.slug)

watchEffect(() => {
  if (event.value) useSeoSchemaBuilder('event', event.value)
})

const formattedDate = computed(() => {
  if (!event.value) return ''
  return new Date(event.value.date).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})
</script>
