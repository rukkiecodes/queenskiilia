<script setup lang="ts">
const model = defineModel<number>({ default: 0 })
defineProps<{ readonly?: boolean }>()
const hover = ref(0)
</script>

<template>
  <div class="stars" :class="{ 'stars--ro': readonly }">
    <button
      v-for="n in 5"
      :key="n"
      type="button"
      class="stars__s"
      :class="{ 'stars__s--on': n <= (hover || model) }"
      :disabled="readonly"
      :aria-label="`${n} star${n > 1 ? 's' : ''}`"
      @click="model = n"
      @mouseenter="!readonly && (hover = n)"
      @mouseleave="hover = 0"
    >
      ★
    </button>
  </div>
</template>

<style scoped>
.stars {
  display: inline-flex;
  gap: 2px;
}
.stars__s {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 1.3rem;
  line-height: 1;
  color: rgba(var(--fui-theme-on-background), 0.25);
  padding: 0 1px;
}
.stars--ro .stars__s {
  cursor: default;
}
.stars__s--on {
  color: rgb(var(--fui-theme-warning));
}
</style>
