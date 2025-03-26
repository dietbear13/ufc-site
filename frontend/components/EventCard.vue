<template>
  <v-card
      class="event-card"
      elevation="3"
      rounded="lg"
      :to="`/events/${event.slug}`"
      link
  >
    <v-card-text class="pb-4">
      <v-row align="center" no-gutters>
        <!-- Миниатюрный логотип турнира -->
        <v-col cols="auto">
          <v-img
              :src="imageSrc"
              width="64"
              height="64"
              class="event-logo rounded"
              cover
              @error="onImageError"
          />
        </v-col>

        <!-- Основная информация -->
        <v-col class="pl-4">
          <div class="text-h6 font-weight-bold mb-1">
            {{ event.name }}
          </div>

          <div class="text-subtitle-2 text-grey-darken-1 d-flex align-center">
            <v-icon icon="mdi-calendar" size="16" class="mr-1" />
            {{ formattedDate }}
          </div>

          <div class="text-body-2 mt-1 d-flex align-center">
            <v-icon icon="mdi-map-marker" size="16" class="mr-1" />
            {{ event.location }}
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
const props = defineProps<{
  event: {
    name: string
    date: string
    location: string
    poster?: string
    slug: string
  }
}>()

const defaultPoster = '/images/tournament_default.png'
const imageSrc = ref(props.event.poster || defaultPoster)

const onImageError = () => {
  imageSrc.value = defaultPoster
}

const formattedDate = computed(() => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(props.event.date).toLocaleDateString('ru-RU', options)
})
</script>

<style scoped>
.event-card {
  transition: transform 0.2s;
  padding: 12px 0;
}
.event-card:hover {
  transform: scale(1.02);
}

.event-logo {
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
</style>
