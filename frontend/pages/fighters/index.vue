<template>
  <v-container>
    <h1 class="text-h5 mb-4">Список бойцов</h1>
    <PaginationCards :items="fighters">
      <template #default="{ item }">
        <FighterCard :fighter="item" />
      </template>
    </PaginationCards>
  </v-container>
</template>

<script setup>
import FighterCard from '../../components/FighterCard.vue'
import { useFighters } from '../../composables/useFighters'
import PaginationCards from '../../components/ui/PaginationCards.vue'
import { useSeoHead } from '../../composables/useSeoHead'

const { fighters, loadFighters } = useFighters()
await loadFighters()

useSeoHead({
  title: 'Список бойцов UFC',
  description: 'Актуальные профили бойцов UFC с фото, страной, рекордами и весом.',
  canonical: 'http://localhost:3000/fighters'
})
</script>
