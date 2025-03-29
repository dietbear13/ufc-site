<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '../../composables/useApi'

// Берём page из query, по умолчанию 1
const route = useRoute()
const router = useRouter()

const page = ref<number>(parseInt(route.query.page as string) || 1)
const limit = 12

// Вызываем наш useApi без search
const {
  data: eventsData,
  refresh,
  set
} = useApi('/events', {
  params: {
    page: page.value,
    limit: limit
  },
  immediate: false
})

// Локальные стейты для загрузки и ошибок
const isLoading = ref(false)
const errorMsg = ref<string | null>(null)

async function loadData() {
  try {
    isLoading.value = true
    // Обновим параметры (если нужно) и сделаем запрос
    await refresh()
    errorMsg.value = null
  } catch (error: any) {
    errorMsg.value = error.message || 'Ошибка при загрузке'
  } finally {
    isLoading.value = false
  }
}

// При монтировании грузим первую страницу
onMounted(() => {
  loadData()
})

// Следим за изменением page, чтобы обновить query и перезапросить
watch(page, () => {
  router.replace({
    query: {
      page: String(page.value)
    }
  })
  loadData()
})
</script>

<template>
  <v-container>
    <!-- Ошибка -->
    <div v-if="errorMsg">
      <p>Ошибка: {{ errorMsg }}</p>
    </div>
    <!-- Прелоадер -->
    <div v-else-if="isLoading">
      <p>Загрузка...</p>
    </div>
    <!-- Список событий -->
    <div v-else>
      <v-row>
        <v-col
            v-for="eventItem in eventsData?.events"
            :key="eventItem.slug"
            cols="12" sm="6" md="4"
        >
          <EventCard :event="eventItem" />
        </v-col>
      </v-row>

      <!-- Пагинация -->
      <v-pagination
          class="mt-4"
          v-model="page"
          :length="Math.ceil((eventsData?.total || 0) / limit)"
          total-visible="5"
      />
    </div>
  </v-container>
</template>
