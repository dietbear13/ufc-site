<template>
  <v-container v-if="fighter">
    <v-row>
      <!-- Fighter Image -->
      <v-col cols="12" md="4">
        <v-img :src="fighter.image" aspect-ratio="1" cover class="rounded-lg" />
      </v-col>
      <!-- Fighter Info -->
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
              <v-icon icon="mdi-cake-variant" class="mr-2" />
              Возраст: <strong>{{ fighter.age ? fighter.age + ' лет' : 'неизвестно' }}</strong>
            </v-list-item-title>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>
              <v-icon icon="mdi-scale-balance" class="mr-2" />
              Дивизион: <strong>{{ fighter.division || 'неизвестно' }}</strong>
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
    <!-- Fight History -->
    <v-sheet v-if="fighter.fights_history && fighter.fights_history.length" rounded="lg" elevation="1" class="pa-4 mt-8">
      <h2 class="text-h6 font-weight-bold mb-4">История боёв</h2>
      <v-table density="compact">
        <thead>
        <tr>
          <th>Дата</th>
          <th>Событие</th>
          <th>Соперник</th>
          <th>Результат</th>
          <th>Метод</th>
          <th>Раунд</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(fight, index) in fighter.fights_history" :key="index">
          <td>{{ fight.date }}</td>
          <td>
            <template v-if="fight.event_slug">
              <NuxtLink :to="'/events/' + fight.event_slug">{{ fight.event }}</NuxtLink>
            </template>
            <template v-else>{{ fight.event }}</template>
          </td>
          <td>
            <template v-if="fight.opponent_slug">
              <NuxtLink :to="'/fighters/' + fight.opponent_slug">{{ fight.opponent }}</NuxtLink>
            </template>
            <template v-else>{{ fight.opponent }}</template>
          </td>
          <td>
            <span v-if="fight.status === 'отменён'">Отменён</span>
            <span v-else-if="fight.result === 'win'">Победа</span>
            <span v-else-if="fight.result === 'lose'">Поражение</span>
            <span v-else-if="fight.result === 'draw'">Ничья</span>
            <span v-else>{{ fight.result }}</span>
          </td>
          <td>{{ fight.method }}</td>
          <td>{{ fight.round }}</td>
        </tr>
        </tbody>
      </v-table>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { useFighters } from '../../composables/useFighters'
import { useRoute } from 'vue-router'
import { useSeoSchemaBuilder } from '../../composables/useSeoSchemaBuilder'
import { useSeoHead } from '../../composables/useSeoHead'

const route = useRoute()
const { fighters, loadFighters } = useFighters()
const fighter = ref(null)

await loadFighters()
fighter.value = fighters.value.find(f => f.slug === route.params.slug)

watchEffect(() => {
  if (fighter.value) {
    useSeoSchemaBuilder('fighter', fighter.value)
    useSeoHead({
      title: fighter.value.name,
      canonical: `http://localhost:3000/fighters/${fighter.value.slug}`
    })
  }
})
</script>
