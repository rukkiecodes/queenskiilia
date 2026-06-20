import type { MaybeRefOrGetter } from 'vue'

/**
 * Authoritative countdown to an ISO timestamp. Recomputes from `target - now` on
 * every tick, so it stays correct across tab blur / reload (no drift). Client-only.
 */
export function useCountdown(target: MaybeRefOrGetter<string | null>, onExpire?: () => void) {
  const secondsLeft = ref(0)
  let timer: ReturnType<typeof setInterval> | undefined
  let fired = false

  function tick() {
    const t = toValue(target)
    if (!t) {
      secondsLeft.value = 0
      return
    }
    const ms = new Date(t).getTime() - Date.now()
    secondsLeft.value = Math.max(0, Math.floor(ms / 1000))
    if (secondsLeft.value === 0 && !fired) {
      fired = true
      if (timer) clearInterval(timer)
      onExpire?.()
    }
  }

  onMounted(() => {
    tick()
    timer = setInterval(tick, 1000)
  })
  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  const label = computed(() => {
    const m = Math.floor(secondsLeft.value / 60)
    const s = secondsLeft.value % 60
    return `${m}:${String(s).padStart(2, '0')}`
  })

  return { secondsLeft, label }
}
