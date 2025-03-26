<template>
  <section>
    <h1 class="text-3xl font-bold text-secondary mb-4">Все турниры</h1>
    <!-- Фильтр по названию турнира -->
    <v-text-field v-model="search" label="Поиск турнира..." outlined dense class="mb-4" />
    <!-- Сетка карточек турниров -->
    <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      <EventCard
          v-for="event in filteredEvents" :key="event.slug"
          :event="event" />
    </div>
  </section>
</template>

<script setup lang="ts">
// import EventCard from '~/components/EventCard.vue';
// import { useEvents } from '~/composables/useEvents';
//
// const { events } = useEvents();
// const search = ref('');
// const filteredEvents = computed(() => {
//   if (!search.value) return events.value;
//   return events.value.filter(evt =>
//       evt.title.toLowerCase().includes(search.value.toLowerCase()) ||
//       evt.place?.toLowerCase().includes(search.value.toLowerCase())
//   );
// });

useHead({
  title: 'Турниры UFC – расписание и результаты',
  meta: [
    { name: 'description', content: 'Список турниров UFC: даты, места проведения и участники.' }
  ]
});
</script>
