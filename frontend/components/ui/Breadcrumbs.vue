<template>
  <nav class="breadcrumbs" aria-label="Хлебные крошки">
    <v-row align="center" no-gutters class="flex-nowrap">
      <template v-for="(crumb, index) in breadcrumbs" :key="index">
        <!-- Разделитель -->
        <v-icon
            v-if="index !== 0"
            class="mx-2"
            color="grey-darken-1"
            size="18"
        >
          mdi-chevron-right
        </v-icon>

        <!-- Последний пункт — всегда текст -->
        <span
            v-if="index === breadcrumbs.length - 1"
            class="breadcrumb-current"
        >
          {{ crumb.name }}
        </span>

        <!-- Все предыдущие — кликабельные -->
        <span v-else>
          <NuxtLink :to="crumb.link" class="breadcrumb-link">
            {{ crumb.name }}
          </NuxtLink>
        </span>
      </template>
    </v-row>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  breadcrumbs: { name: string; link?: string }[]
}>()
</script>

<style scoped>
.breadcrumbs {
  font-size: 15px;
  white-space: nowrap;
  overflow-x: auto;
  padding-block: 4px;
}

.breadcrumb-link {
  color: #1976d2;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: #1565c0;
  text-decoration: underline;
}

.breadcrumb-current {
  font-weight: 600;
  color: #424242;
}
</style>
