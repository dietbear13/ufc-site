<template>
  <section class="text-center py-10">
    <h1 class="text-4xl font-bold mb-6">Добро пожаловать в MMA World</h1>
    <p class="text-lg mb-8">
      Последние новости UFC, профили бойцов и информация о турнирах.
    </p>
    <v-btn color="primary" to="/fighters" class="ma-2">Все бойцы</v-btn>
    <v-btn color="primary" to="/events" class="ma-2">Ближайшие турниры</v-btn>
    <v-btn color="primary" outlined to="/blog" class="ma-2">Новости блога</v-btn>
  </section>
</template>

<script setup lang="ts">
useHead({
  title: 'MMA World – Новости и бойцы UFC',
  meta: [
    { name: 'description', content: 'Добро пожаловать на неофициальный сайт UFC: профили бойцов, турниры и новости MMA.' }
  ]
});
</script>
