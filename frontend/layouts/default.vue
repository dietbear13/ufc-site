<template>
  <v-app>
    <TheHeader />
    <v-main class="px-4 py-6">
      <NuxtPage />
    </v-main>
    <TheFooter />
  </v-app>
</template>

<script setup lang="ts">
import TheHeader from '@/components/ui/TheHeader.vue'
import TheFooter from '@/components/ui/TheFooter.vue'
</script>
