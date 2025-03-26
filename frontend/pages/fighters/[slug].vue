<template>
  <v-container v-if="fighter">
    <v-row>
      <v-col cols="12" md="4">
        <v-img :src="fighter.image" aspect-ratio="1" cover class="rounded-lg" />
      </v-col>

      <v-col cols="12" md="8">
        <v-list density="compact">
          <v-list-item>
            <v-list-item-title>
              <v-icon icon="mdi-flag" class="mr-2" />
              Страна: <strong>{{ fighter.country }}</strong>
            </v-list-item-title>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>
              <v-icon icon="mdi-weight-lifter" class="mr-2" />
              Вес: <strong>{{ fighter.weight || 'неизвестно' }}</strong>
            </v-list-item-title>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>
              <v-icon icon="mdi-sword-cross" class="mr-2" />
              Рекорд: <strong>{{ fighter.record || 'N/A' }}</strong>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useFighters } from '../../composables/useFighters'
import { useRoute } from 'vue-router'
import { useSeoSchemaBuilder } from '../../composables/useSeoSchemaBuilder'

const route = useRoute()
const { fighters, loadFighters } = useFighters()
const fighter = ref(null)

await loadFighters()
fighter.value = fighters.value.find(f => f.slug === route.params.slug)

watchEffect(() => {
  if (fighter.value) useSeoSchemaBuilder('fighter', fighter.value)
})
</script>
