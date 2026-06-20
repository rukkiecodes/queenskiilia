<script setup lang="ts">
const model = defineModel<string[]>({ default: () => [] })
const input = ref('')

function add() {
  const value = input.value.trim()
  if (value && !model.value.includes(value)) {
    model.value = [...model.value, value]
  }
  input.value = ''
}
function remove(skill: string) {
  model.value = model.value.filter((s) => s !== skill)
}
</script>

<template>
  <div class="skills">
    <label class="skills__label">Skills</label>
    <div v-if="model.length" class="skills__chips">
      <span v-for="s in model" :key="s" class="skills__chip">
        {{ s }}
        <button type="button" class="skills__x" :aria-label="`Remove ${s}`" @click="remove(s)">×</button>
      </span>
    </div>
    <form @submit.prevent="add">
      <f-input
        v-model="input"
        placeholder="Add a skill and press Enter"
        append-icon="plus"
        @keydown.enter.prevent="add"
      />
    </form>
  </div>
</template>

<style scoped>
.skills {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.skills__label {
  font-size: 0.85rem;
  opacity: 0.7;
}
.skills__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.skills__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px 4px 12px;
  border-radius: 9999px;
  background: rgba(var(--fui-theme-primary), 0.1);
  color: rgb(var(--fui-theme-primary));
  font-size: 0.85rem;
}
.skills__x {
  border: 0;
  background: rgba(var(--fui-theme-primary), 0.18);
  color: inherit;
  border-radius: 9999px;
  width: 18px;
  height: 18px;
  line-height: 1;
  cursor: pointer;
}
</style>
