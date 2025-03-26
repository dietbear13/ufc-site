<nav aria-label="Хлебные крошки" itemscope itemtype="https://schema.org/BreadcrumbList">
<ol class="flex flex-wrap list-none p-0">
  <li v-for="(crumb, index) in breadcrumbs" :key="index"
      itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem" class="flex items-center">
    <!-- Разделитель между крошками -->
    <span v-if="index !== 0" class="mx-2 text-gray-500">/</span>
    <span v-if="crumb.link">
        <a :href="crumb.link" itemprop="item" class="text-blue-600 hover:underline">
          <span itemprop="name">{{ crumb.name }}</span>
        </a>
      </span>
    <span v-else>
        <span itemprop="name" class="font-semibold">{{ crumb.name }}</span>
      </span>
    <meta itemprop="position" :content="index + 1" />
  </li>
</ol>
</nav>
<script setup lang="ts">
defineProps<{ breadcrumbs: { name: string; link?: string }[] }>();
</script>
