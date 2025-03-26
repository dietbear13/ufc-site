<template>
  <v-container>
    <v-row>
      <v-col
          v-for="fighter in fighters"
          :key="fighter.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
      >
        <FighterCard :fighter="fighter" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import FighterCard from '../../components/FighterCard.vue'
import { useFighters } from '../../composables/useFighters'

const { fighters, loadFighters } = useFighters()
await loadFighters()

useSeoHead({
  title: 'Список бойцов UFC',
  description: 'Актуальные профили бойцов UFC с фото, страной, рекордами и весом.',
  canonical: 'http://localhost:3000/fighters'
})

</script>
