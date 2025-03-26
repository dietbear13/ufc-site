<template>
  <section>
    <h1 class="text-3xl font-bold text-secondary mb-4">Все бойцы</h1>
    <!-- Поле поиска -->
    <v-text-field v-model="search" label="Поиск бойца..." outlined dense class="mb-4" />
    <!-- Сетка карточек бойцов -->
    <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <FighterCard
          v-for="fighter in filteredFighters" :key="fighter.slug"
          :fighter="fighter" />
    </div>
  </section>
</template>

<script setup lang="ts">
// import FighterCard from '~/components/FighterCard.vue';
// import { useFighters } from '~/composables/useFighters';
//
// const { fighters } = useFighters();
// // Строка поиска (реактивная)
// const search = ref<string>('');
// // Фильтрованный список на основе search
// const filteredFighters = computed(() => {
//   if (!search.value) return fighters.value;
//   return fighters.value.filter(f =>
//       f.name.toLowerCase().includes(search.value.toLowerCase()) ||
//       f.country?.toLowerCase().includes(search.value.toLowerCase())
//   );
// });

// SEO meta
useHead({
  title: 'Бойцы UFC – список',
  meta: [
    { name: 'description', content: 'Список бойцов UFC с рекордами и профилями.' }
  ]
});
</script>
