import { useQuery } from '@tanstack/vue-query'
import { profileApi } from '~/lib/profile-api'

/** Top students ranked by average rating (the `users` query is public). */
export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const users = await profileApi.searchUsers({ accountType: 'student', limit: 50 })
      return [...users].sort(
        (a, b) => (b.studentProfile?.averageRating ?? -1) - (a.studentProfile?.averageRating ?? -1),
      )
    },
  })
}
