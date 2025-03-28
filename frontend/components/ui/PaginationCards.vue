<template>
  <div>
    <v-row>
      <v-col
          v-for="(item, index) in paginatedItems"
          :key="index"
          cols="12"
          sm="6"
          md="4"
      >
        <slot :item="item" />
      </v-col>
    </v-row>

    <v-pagination
        v-if="pageCount > 1"
        v-model="currentPage"
        :length="pageCount"
        class="mt-6"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps<{
  items: any[]
  perPage?: number
}>()

const route = useRoute()
const router = useRouter()

const currentPage = ref(Number(route.query.p) || 1)
const perPage = computed(() => props.perPage || 6)

watch(currentPage, (val) => {
  router.replace({ query: { ...route.query, p: val === 1 ? undefined : String(val) } })
})

const pageCount = computed(() => Math.ceil(props.items.length / perPage.value))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return props.items.slice(start, start + perPage.value)
})
</script>
