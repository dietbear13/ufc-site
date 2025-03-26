<template>
  <div class="layout-wrapper">
    <!-- Фиксированная шапка -->
    <TheHeader />

    <!-- Основной контент -->
    <v-main class="layout-main">
      <NuxtPage />
    </v-main>

    <!-- Прижатый футер -->
    <TheFooter />
  </div>
</template>

<script setup lang="ts">
import TheHeader from '@/components/ui/TheHeader.vue'
import TheFooter from '@/components/ui/TheFooter.vue'
</script>

<style scoped>
</style>
