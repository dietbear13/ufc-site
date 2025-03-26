<template>
  <v-card
      class="event-card"
      elevation="3"
      rounded="lg"
      :to="`/events/${event.slug}`"
      link
  >
    <v-img
        :src="event.poster"
        height="220"
        cover
        class="rounded-t-lg"
    ></v-img>

    <v-card-text>
      <div class="text-h6 font-weight-bold mb-1">
        {{ event.name }}
      </div>
      <div class="text-subtitle-2 text-grey-darken-1">
        <v-icon icon="mdi-calendar" size="16" class="mr-1" />
        {{ formattedDate }}
      </div>
      <div class="text-body-2 mt-1">
        <v-icon icon="mdi-map-marker" size="16" class="mr-1" />
        {{ event.location }}
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
const { event } = defineProps(['event'])

const formattedDate = computed(() => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(event.date).toLocaleDateString('ru-RU', options)
})
</script>


<!--У меня есть скрипт парсер, который собирает все турниры и бойцов в md-файлы, но это устаревший подход для моего проекта, давай адаптируем.-->

<style scoped>
.event-card {
  transition: transform 0.2s;
}
.event-card:hover {
  transform: scale(1.02);
}
</style>
