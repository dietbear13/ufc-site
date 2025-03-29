<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '../../composables/useApi'

// Параметры пагинации
const route = useRoute()
const router = useRouter()

const page = ref<number>(parseInt(route.query.page as string) || 1)
const limit = 12

// useApi без search
const {
  data: fightersData,
  refresh,
  set
} = useApi('/fighters', {
  params: {
    page: page.value,
    limit: limit
  },
  immediate: false
})

const isLoading = ref(false)
const errorMsg = ref<string | null>(null)

async function loadData() {
  try {
    isLoading.value = true
    await refresh()
    errorMsg.value = null
  } catch (error: any) {
    errorMsg.value = error.message || 'Ошибка при загрузке'
  } finally {
    isLoading.value = false
  }
}

// Загружаем при монтировании
onMounted(() => {
  loadData()
})

// Следим за page => обновляем router query => перезапрашиваем
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
    <!-- Список бойцов -->
    <div v-else>
      <v-row>
        <v-col
            v-for="fighter in fightersData?.fighters"
            :key="fighter.slug"
            cols="12" sm="6" md="4"
        >
          <FighterCard :fighter="fighter" />
        </v-col>
      </v-row>

      <!-- Пагинация -->
      <v-pagination
          class="mt-4"
          v-model="page"
          :length="Math.ceil((fightersData?.total || 0) / limit)"
          total-visible="5"
      />
    </div>
  </v-container>
</template>
