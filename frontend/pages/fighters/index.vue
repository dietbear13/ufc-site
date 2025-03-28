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
import PaginationCards from '../../components/ui/PaginationCards.vue'
import { useSeoHead } from '../../composables/useSeoHead'
import { useApi } from '~/composables/useApi'

const { data: fighters } = await useAsyncData('fighters', () =>
    useApi('/fighters', {
      lazy: false,
      cacheKey: 'fighters',
      transform: (data) => data.fighters || data
    }).refresh()
)

// import { useFighters } from '../../composables/useFighters'
// const { fighters, loadFighters } = useFighters()
// await loadFighters()

useSeoHead({
  title: 'Список бойцов UFC',
  description: 'Актуальные профили бойцов UFC с фото, страной, рекордами и весом.',
  canonical: 'http://localhost:3000/fighters'
})
</script>
