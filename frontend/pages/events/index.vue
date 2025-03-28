<template>
  <v-container>
    <h1 class="text-h5 mb-4">Предстоящие турниры</h1>
    <PaginationCards :items="events">
      <template #default="{ item }">
        <EventCard :event="item" />
      </template>
    </PaginationCards>
  </v-container>
</template>

<script setup>
import EventCard from '../../components/EventCard.vue'
import { useEvents } from '../../composables/useEvents'
import PaginationCards from '~/components/ui/PaginationCards.vue'
import { useSeoHead } from '~/composables/useSeoHead'

const { events, loadEvents } = useEvents()
await loadEvents()

useSeoHead({
  title: 'Календарь турниров UFC',
  description: 'Полное расписание турниров UFC – даты, локации, постеры и кард боёв.',
  canonical: 'http://localhost:3000/events'
})
</script>
