<script setup lang="ts">
import { format } from 'date-fns'
import type { ChatMessage } from '~/types/chat'

const props = defineProps<{ message: ChatMessage; mine: boolean }>()
const time = computed(() => {
  const d = new Date(props.message.sentAt)
  return Number.isNaN(d.getTime()) ? '' : format(d, 'p')
})
</script>

<template>
  <div class="cb" :class="{ 'cb--mine': mine }">
    <div class="cb__bubble" :class="{ 'cb__bubble--failed': message.failed }">
      <p v-if="message.content" class="cb__text">{{ message.content }}</p>
      <a
        v-for="(url, i) in message.attachmentUrls"
        :key="i"
        :href="url"
        target="_blank"
        rel="noopener"
        class="cb__att"
      >
        <f-icon icon="paperclip" /> Attachment {{ i + 1 }}
      </a>
      <span class="cb__meta">
        {{ time }}
        <template v-if="message.pending"> · sending…</template>
        <template v-else-if="message.failed"> · failed</template>
        <template v-else-if="mine && message.isRead"> · read</template>
      </span>
    </div>
  </div>
</template>

<style scoped>
.cb {
  display: flex;
  margin: 4px 0;
}
.cb--mine {
  justify-content: flex-end;
}
.cb__bubble {
  max-width: 72%;
  padding: 9px 13px;
  border-radius: 16px;
  background: rgb(var(--fui-theme-surface));
  border: 1px solid rgba(var(--fui-theme-on-background), 0.1);
}
.cb--mine .cb__bubble {
  background: rgb(var(--fui-theme-primary));
  color: rgb(var(--fui-theme-on-primary));
  border-color: transparent;
}
.cb__bubble--failed {
  opacity: 0.6;
  border-color: rgb(var(--fui-theme-danger));
}
.cb__text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
.cb__att {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: inherit;
  font-size: 0.85rem;
  text-decoration: underline;
}
.cb__meta {
  display: block;
  margin-top: 4px;
  font-size: 0.68rem;
  opacity: 0.6;
}
</style>
