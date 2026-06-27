<script setup lang="ts">
import { INDUSTRIES } from '~/lib/industries'

const model = defineModel<string | null>({ default: null })
const label = defineModel<string>('label', { default: 'Industry' })
</script>

<template>
  <f-select
    v-model="model"
    :items="INDUSTRIES"
    :label="label"
    placeholder="Select an industry"
    filter
    clearable
  />
</template>
