import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CategoriesApi, type CreateCategoryRequest } from '@/src/api/categories.api';

const key = ['categories'];

export function useCategories(includeArchived = false) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: [...key, includeArchived],
    queryFn: () => CategoriesApi.list(includeArchived),
  });
  const invalidate = () => client.invalidateQueries({ queryKey: key });
  const create = useMutation({
    mutationFn: (payload: CreateCategoryRequest) => CategoriesApi.create(payload),
    onSuccess: invalidate,
  });
  const archive = useMutation({ mutationFn: CategoriesApi.archive, onSuccess: invalidate });
  const unarchive = useMutation({ mutationFn: CategoriesApi.unarchive, onSuccess: invalidate });
  return {
    categories: query.data ?? [],
    ...query,
    createCategory: create.mutateAsync,
    archiveCategory: archive.mutateAsync,
    unarchiveCategory: unarchive.mutateAsync,
  };
}
