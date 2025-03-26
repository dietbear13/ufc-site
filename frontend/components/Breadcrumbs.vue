<template>
  <nav
      class="breadcrumbs"
      aria-label="Хлебные крошки"
      itemscope
      itemtype="https://schema.org/BreadcrumbList"
  >
    <v-row align="center" no-gutters class="flex-nowrap">
      <template v-for="(crumb, index) in breadcrumbs" :key="index">
        <!-- Разделитель -->
        <v-icon v-if="index !== 0" class="mx-2" color="grey-darken-1" size="18">mdi-chevron-right</v-icon>

        <!-- Ссылка или активный элемент -->
        <span
            v-if="crumb.link"
            itemprop="itemListElement"
            itemscope
            itemtype="https://schema.org/ListItem"
        >
          <NuxtLink
              :to="crumb.link"
              class="breadcrumb-link"
              itemprop="item"
          >
            <span itemprop="name">{{ crumb.name }}</span>
          </NuxtLink>
          <meta itemprop="position" :content="index + 1" />
        </span>

        <span
            v-else
            class="breadcrumb-current"
            itemprop="itemListElement"
            itemscope
            itemtype="https://schema.org/ListItem"
        >
          <span itemprop="name">{{ crumb.name }}</span>
          <meta itemprop="position" :content="index + 1" />
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
