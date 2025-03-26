<template>
  <v-footer
      color="grey lighten-4"
      class="pa-6 mt-12"
      style="width: 100%"
  >
    <v-container>
      <v-row>
        <!-- Блок 1 -->
        <v-col cols="12" md="4">
          <p class="text-body-2 text-grey-darken-1">
            MMA World — неофициальный фан-сайт о бойцах, турнирах и аналитике боёв UFC.
          </p>
        </v-col>

        <!-- Блок 2 -->
        <v-col cols="12" md="4">
          <ul class="list-none pa-0">
            <li v-for="link in links" :key="link.to" class="mb-1">
              <NuxtLink :to="link.to" class="text-body-2 text-primary hover:underline">
                {{ link.name }}
              </NuxtLink>
            </li>
          </ul>
        </v-col>

        <!-- Блок 3 -->
        <v-col cols="12" md="4">
          <div class="d-flex gap-4">
            <a href="https://instagram.com" target="_blank">
              <v-icon size="24" color="red-darken-2">mdi-instagram</v-icon>
            </a>
            <a href="https://twitter.com" target="_blank">
              <v-icon size="24" color="blue">mdi-twitter</v-icon>
            </a>
            <a href="https://youtube.com" target="_blank">
              <v-icon size="24" color="red">mdi-youtube</v-icon>
            </a>
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <div class="text-center text-caption text-grey-darken-1">
        © 2025 MMA World. Все права защищены.
      </div>
    </v-container>
  </v-footer>
</template>

<script setup>
const links = [
  { name: 'Бойцы', to: '/fighters' },
  { name: 'Турниры', to: '/events' },
  { name: 'Блог', to: '/blog' }
]
</script>
