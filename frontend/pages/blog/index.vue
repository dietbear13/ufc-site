<template>
  <section>
    <h1 class="text-3xl font-bold mb-6">Новости UFC</h1>
    <div class="space-y-6">
      <div v-for="post in posts" :key="post.slug" class="border-b pb-4">
        <NuxtLink :to="`/blog/${post.slug}`" class="text-2xl text-primary font-bold hover:underline">
          {{ post.title }}
        </NuxtLink>
        <p class="text-sm text-gray-500">
          <time :datetime="post.date">{{ formatDate(post.date) }}</time>
          <span v-if="post.author"> — {{ post.author }}</span>
        </p>
        <p v-if="post.excerpt" class="mt-2 text-gray-700">{{ post.excerpt }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// import { usePosts } from '~/composables/usePosts';
// const { posts } = usePosts();
// const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('ru-RU');
useHead({
  title: 'Блог UFC – новости и статьи',
  meta: [{ name: 'description', content: 'Свежие новости UFC, аналитика боёв и статьи из мира MMA.' }]
});
</script>
