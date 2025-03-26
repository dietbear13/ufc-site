<script setup lang="ts">
import { useSeoSchemaBuilder } from '@/composables/useSeoSchemaBuilder'

const props = defineProps<{
  breadcrumbs: { name: string; link?: string }[]
}>()

// даже если только один пункт — добавим микроразметку
watchEffect(() => {
  if (props.breadcrumbs?.length > 0) {
    useSeoSchemaBuilder('breadcrumbs', props.breadcrumbs)
  }
})
</script>

<template>
  <!-- Компонент не отрисовывается визуально -->
</template>
