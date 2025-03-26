<template>
  <v-container>
    <v-row>
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
import EventCard from '../../components/EventCard.vue'
import { useEvents } from '../../composables/useEvents'

const { events, loadEvents } = useEvents()
await loadEvents()
</script>
