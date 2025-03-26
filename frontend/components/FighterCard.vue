<template>
  <v-card
      class="fighter-card"
      elevation="3"
      rounded="lg"
      :to="`/fighters/${fighter.slug}`"
      link
  >
    <v-img
        :src="imageSrc"
        max-height="240"
        cover
        class="rounded-t-lg"
        @error="onImageError"
    />

    <v-card-text>
      <div class="text-h6 font-weight-bold">
        {{ fighter.name }}
      </div>

      <div
          v-if="fighter.nickname"
          class="text-subtitle-2 text-grey-darken-1 mb-1"
      >
        «{{ fighter.nickname }}»
      </div>

      <div class="text-body-2">
        <v-icon icon="mdi-flag" size="16" class="mr-1" />
        {{ fighter.country }}
      </div>

      <div class="text-body-2">
        <v-icon icon="mdi-weight-lifter" size="16" class="mr-1" />
        {{ fighter.division }}
      </div>

      <div class="text-body-2">
        <v-icon icon="mdi-sword-cross" size="16" class="mr-1" />
        {{ fighter.record }}
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
const props = defineProps<{
  fighter: {
    name: string
    nickname?: string
    country: string
    division: string
    record: string
    slug: string
    image?: string
  }
}>()

const defaultImage = '/images/fighter_default.png'
const imageSrc = ref(props.fighter.image || defaultImage)

const onImageError = () => {
  imageSrc.value = defaultImage
}
</script>

<style scoped>
.fighter-card {
  transition: transform 0.2s;
}
.fighter-card:hover {
  transform: scale(1.02);
}
</style>
