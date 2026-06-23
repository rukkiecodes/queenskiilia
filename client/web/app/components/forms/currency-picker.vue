<script setup lang="ts">
const CURRENCIES = ['NGN', 'USD', 'GHS', 'KES', 'ZAR', 'GBP', 'EUR']
const model = defineModel<string>({ default: 'NGN' })
</script>

<template>
  <f-select v-model="model" :items="CURRENCIES" label="Currency" />
</template>
