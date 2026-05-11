import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { portfolioApi, type PortfolioItem } from '@/lib/portfolio-api';

export const useMyPortfolio = () =>
  useQuery({
    queryKey: ['my-portfolio'],
    queryFn: () => portfolioApi.mine(),
    staleTime: 1000 * 30,
  });

export const useStudentPortfolio = (studentId: string | undefined) =>
  useQuery({
    queryKey: ['student-portfolio', studentId],
    queryFn: () => portfolioApi.forStudent(studentId!),
    enabled: !!studentId,
    staleTime: 1000 * 30,
  });

export const usePortfolioItem = (id: string | undefined) =>
  useQuery({
    queryKey: ['portfolio-item', id],
    queryFn: () => portfolioApi.get(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  });

/**
 * Optimistic visibility toggle: flip both `my-portfolio` and `portfolio-item`
 * caches immediately, then reconcile from the server. On error, restore the
 * snapshot.
 */
export const useUpdatePortfolioItemVisibility = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      portfolioApi.setVisibility(id, isPublic),

    onMutate: async ({ id, isPublic }) => {
      await qc.cancelQueries({ queryKey: ['my-portfolio'] });
      await qc.cancelQueries({ queryKey: ['portfolio-item', id] });

      const prevList = qc.getQueryData<PortfolioItem[]>(['my-portfolio']);
      const prevItem = qc.getQueryData<PortfolioItem>(['portfolio-item', id]);

      qc.setQueryData<PortfolioItem[] | undefined>(['my-portfolio'], (old) =>
        old?.map((i) => (i.id === id ? { ...i, isPublic } : i)),
      );
      qc.setQueryData<PortfolioItem | undefined>(['portfolio-item', id], (old) =>
        old ? { ...old, isPublic } : old,
      );

      return { prevList, prevItem, id };
    },

    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      if (ctx.prevList) qc.setQueryData(['my-portfolio'], ctx.prevList);
      if (ctx.prevItem)
        qc.setQueryData(['portfolio-item', ctx.id], ctx.prevItem);
    },

    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: ['my-portfolio'] });
      qc.invalidateQueries({ queryKey: ['portfolio-item', id] });
    },
  });
};
