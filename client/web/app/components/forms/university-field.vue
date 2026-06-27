<script setup lang="ts">
import { NIGERIAN_INSTITUTIONS } from '~/lib/nigerian-institutions'

const model = defineModel<string | null>({ default: null })
const label = defineModel<string>('label', { default: 'University / institution' })
</script>

<template>
  <f-select
    v-model="model"
    :items="NIGERIAN_INSTITUTIONS"
    :label="label"
    placeholder="Search your institution"
    filter
    clearable
  />
</template>
