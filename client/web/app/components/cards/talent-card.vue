<script setup lang="ts">
import type { PublicUser } from '~/types/profile'

const props = defineProps<{ user: PublicUser }>()
const sp = computed(() => props.user.studentProfile)
const name = computed(() => props.user.fullName ?? 'Talent')
const initial = computed(() => name.value.charAt(0).toUpperCase())
const rating = computed(() => sp.value?.averageRating ?? null)
const skills = computed(() => sp.value?.skills ?? [])
</script>

<template>
  <f-card type="1" class="tcard" @click="navigateTo(`/talent/${user.id}`)">
    <template #img>
      <img v-if="user.avatarUrl" :src="user.avatarUrl" :alt="name" class="tcard__img" />
      <div v-else class="tcard__ph"><span>{{ initial }}</span></div>
    </template>

    <template #interactions>
      <f-btn v-if="rating != null" color="warning" size="small" prepend-icon="star">
        {{ rating.toFixed(1) }}
      </f-btn>
      <f-btn v-if="user.isVerified" icon="badge-check" color="primary" size="small" />
    </template>

    <template #title>
      <h3 class="tcard__name">{{ name }}</h3>
    </template>

    <template #text>
      <p class="tcard__sub">
        <span v-if="sp?.skillLevel" class="tcard__level">{{ sp.skillLevel }}</span>
        <span v-if="sp?.skillLevel && user.country"> · </span>
        <span v-if="user.country">{{ user.country }}</span>
      </p>
      <div v-if="skills.length" class="tcard__skills">
        <f-chip v-for="s in skills.slice(0, 3)" :key="s">{{ s }}</f-chip>
        <span v-if="skills.length > 3" class="tcard__more">+{{ skills.length - 3 }}</span>
      </div>
    </template>
  </f-card>
</template>

<style scoped>
.tcard {
  width: 100%;
  cursor: pointer;
}
.tcard__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.tcard__ph {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgb(var(--fui-theme-primary)), rgba(var(--fui-theme-primary), 0.55));
  color: #fff;
}
.tcard__ph span {
  font-size: 2.4rem;
  font-weight: 800;
}
.tcard__name {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.tcard__sub {
  margin: 4px 0 10px;
  opacity: 0.65;
  font-size: 0.88rem;
}
.tcard__level {
  text-transform: capitalize;
}
.tcard__skills {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.tcard__more {
  font-size: 0.78rem;
  opacity: 0.6;
}
</style>
