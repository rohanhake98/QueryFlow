'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { historyApi } from '@/lib/api';

export function useQueryHistory(connectionId?: string, savedOnly = false) {
  return useQuery({
    queryKey: ['history', connectionId, savedOnly],
    queryFn: async () => {
      const res = await historyApi.list({
        connection_id: connectionId,
        limit: 50,
        saved_only: savedOnly,
      });
      return res.data;
    },
    staleTime: 1000 * 30,
  });
}

export function useSaveQuery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, saved_name }: { id: string; saved_name: string }) =>
      historyApi.save(id, saved_name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['history'] }),
  });
}
