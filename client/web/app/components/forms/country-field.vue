<script setup lang="ts">
import { COUNTRIES } from '~/lib/countries'

const model = defineModel<string | null>({ default: null })
const label = defineModel<string>('label', { default: 'Country' })
</script>

<template>
  <f-select
    v-model="model"
    :items="COUNTRIES"
    :label="label"
    placeholder="Select your country"
    filter
    clearable
  />
</template>
