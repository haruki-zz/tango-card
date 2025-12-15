import {
  DefaultOptions,
  QueryClient,
} from "@tanstack/react-query";

const defaultQueryOptions: DefaultOptions = {
  queries: {
    retry: 1,
    staleTime: 30_000,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: 1,
  },
};

export const createQueryClient = (
  overrides?: DefaultOptions,
): QueryClient => {
  const queries = {
    ...defaultQueryOptions.queries,
    ...overrides?.queries,
  };
  const mutations = {
    ...defaultQueryOptions.mutations,
    ...overrides?.mutations,
  };

  return new QueryClient({
    defaultOptions: {
      queries,
      mutations,
    },
  });
};

export const getDefaultQueryOptions = (): DefaultOptions => ({
  queries: { ...defaultQueryOptions.queries },
  mutations: { ...defaultQueryOptions.mutations },
});
