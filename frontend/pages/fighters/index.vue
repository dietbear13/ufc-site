<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-6">Бойцы UFC</h1>
      </v-col>

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
import FighterCard from '@/components/FighterCard.vue'
import { useFighters } from '@/composables/useFighters.js'

const { fighters, loadFighters } = useFighters()
await loadFighters()
</script>
