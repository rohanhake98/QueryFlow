'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionsApi } from '@/lib/api';
import type { ConnectionCreateRequest } from '@/types';

export function useConnections() {
  return useQuery({
    queryKey: ['connections'],
    queryFn: async () => {
      const res = await connectionsApi.list();
      return res.data.connections;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ConnectionCreateRequest) => connectionsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connections'] }),
  });
}

export function useDeleteConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => connectionsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connections'] }),
  });
}

export function useRefreshSchema() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => connectionsApi.refreshSchema(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connections'] }),
  });
}
