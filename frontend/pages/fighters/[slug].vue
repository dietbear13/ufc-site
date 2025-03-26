<template>
  <v-container v-if="fighter">
    <v-row>
      <!-- Фото бойца -->
      <v-col cols="12" md="4">
        <v-img
            :src="fighter.image"
            aspect-ratio="1"
            class="rounded-lg"
            cover
        />
      </v-col>

      <!-- Основная информация -->
      <v-col cols="12" md="8">
        <h1 class="text-h4 font-weight-bold mb-2">{{ fighter.name }}</h1>
        <h2 class="text-subtitle-1 text-grey-darken-1 mb-4">
          "{{ fighter.nickname }}"
        </h2>

        <v-list density="compact" class="mb-4">
          <v-list-item>
            <v-list-item-title>
              <v-icon icon="mdi-flag" class="mr-2" />
              Страна: <strong>{{ fighter.country }}</strong>
            </v-list-item-title>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>
              <v-icon icon="mdi-weight-lifter" class="mr-2" />
              Весовая категория: <strong>{{ fighter.division }}</strong>
            </v-list-item-title>
          </v-list-item>

          <v-list-item>
            <v-list-item-title>
              <v-icon icon="mdi-sword-cross" class="mr-2" />
              Рекорд: <strong>{{ fighter.record }}</strong>
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <v-btn
            color="primary"
            prepend-icon="mdi-arrow-left"
            :to="`/fighters`"
            variant="text"
        >
          Назад к списку бойцов
        </v-btn>
      </v-col>
    </v-row>

    <!-- Место для будущей статистики и боёв -->
    <v-divider class="my-8" />

    <v-row>
      <v-col cols="12">
        <h2 class="text-h5 font-weight-medium mb-4">Последние бои (в разработке)</h2>
        <p class="text-body-2 text-grey">
          Здесь появятся последние поединки и статистика бойца.
        </p>
      </v-col>
    </v-row>
  </v-container>

  <v-container v-else>
    <v-row>
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary" size="48" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useFighters } from '@/composables/useFighters.js'

const route = useRoute()
const { fighters, loadFighters } = useFighters()
const fighter = ref(null)

await loadFighters()

fighter.value = fighters.value.find(
    (f) => f.slug === route.params.slug
)
</script>
