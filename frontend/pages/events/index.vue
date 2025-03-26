<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-6">Турниры UFC</h1>
      </v-col>

      <v-col
          v-for="event in events"
          :key="event.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
      >
        <EventCard :event="event" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import EventCard from '@/components/EventCard.vue'
import { useEvents } from '@/composables/useEvents.js'

const { events, loadEvents } = useEvents()
await loadEvents()
</script>
