<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import { SKILL_CATALOG } from '~/lib/skills-catalog'

const model = defineModel<string[]>({ default: () => [] })
const search = ref('')
const query = refDebounced(search, 120)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return SKILL_CATALOG
  return SKILL_CATALOG.map((g) => ({
    category: g.category,
    skills: g.skills.filter((s) => s.toLowerCase().includes(q)),
  })).filter((g) => g.skills.length)
})

const canAddCustom = computed(() => {
  const q = search.value.trim()
  if (!q) return false
  const lower = q.toLowerCase()
  const inCatalog = SKILL_CATALOG.some((g) => g.skills.some((s) => s.toLowerCase() === lower))
  const inModel = model.value.some((s) => s.toLowerCase() === lower)
  return !inCatalog && !inModel
})

function toggle(skill: string) {
  model.value = model.value.includes(skill)
    ? model.value.filter((s) => s !== skill)
    : [...model.value, skill]
}
function remove(skill: string) {
  model.value = model.value.filter((s) => s !== skill)
}
function addCustom() {
  const q = search.value.trim()
  if (q && !model.value.some((s) => s.toLowerCase() === q.toLowerCase())) {
    model.value = [...model.value, q]
  }
  search.value = ''
}
</script>

<template>
  <div class="skills">
    <label class="skills__label">Skills</label>

    <div v-if="model.length" class="skills__selected">
      <span v-for="s in model" :key="s" class="skills__chip skills__chip--on">
        {{ s }}
        <button type="button" class="skills__x" :aria-label="`Remove ${s}`" @click="remove(s)">×</button>
      </span>
    </div>

    <form @submit.prevent="addCustom">
      <f-input
        v-model="search"
        prepend-icon="search"
        placeholder="Search skills, or type your own and press Enter"
      />
    </form>
    <button v-if="canAddCustom" type="button" class="skills__custom" @click="addCustom">
      + Add “{{ search.trim() }}”
    </button>

    <div class="skills__catalog">
      <div v-for="group in filtered" :key="group.category" class="skills__group">
        <p class="skills__cat">{{ group.category }}</p>
        <div class="skills__chips">
          <button
            v-for="s in group.skills"
            :key="s"
            type="button"
            class="skills__chip skills__chip--pick"
            :class="{ 'skills__chip--on': model.includes(s) }"
            @click="toggle(s)"
          >
            <span v-if="model.includes(s)" class="skills__tick">✓</span>{{ s }}
          </button>
        </div>
      </div>
      <p v-if="!filtered.length" class="skills__empty">
        No matches — press Enter to add “{{ search.trim() }}”.
      </p>
    </div>
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
.skills__selected {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.skills__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 0.85rem;
  border: 1px solid rgba(var(--fui-theme-on-background), 0.18);
  background: transparent;
  color: rgb(var(--fui-theme-on-background));
  cursor: pointer;
  line-height: 1.2;
}
.skills__chip--pick:hover {
  border-color: rgb(var(--fui-theme-primary));
}
.skills__chip--on {
  background: rgba(var(--fui-theme-primary), 0.12);
  border-color: rgb(var(--fui-theme-primary));
  color: rgb(var(--fui-theme-primary));
}
.skills__selected .skills__chip--on {
  padding-right: 6px;
}
.skills__tick {
  font-weight: 700;
}
.skills__x {
  border: 0;
  background: rgba(var(--fui-theme-primary), 0.2);
  color: inherit;
  border-radius: 9999px;
  width: 18px;
  height: 18px;
  line-height: 1;
  cursor: pointer;
}
.skills__custom {
  align-self: flex-start;
  border: 0;
  background: transparent;
  color: rgb(var(--fui-theme-primary));
  font-size: 0.85rem;
  cursor: pointer;
  padding: 2px 0;
}
.skills__catalog {
  max-height: 264px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 2px;
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
  border-radius: var(--fui-radius-md);
}
.skills__group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 6px;
}
.skills__cat {
  margin: 0;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.5;
}
.skills__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.skills__empty {
  opacity: 0.6;
  font-size: 0.85rem;
  padding: 8px;
}
</style>
