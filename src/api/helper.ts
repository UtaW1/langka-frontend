// src/api/helpers.ts
import { PaginationParams } from '@/types';

export const withPage = <T extends PaginationParams>(p?: T): (T & { page_size: number; page_number: number }) => {
  const pageSize = p?.page_size ?? 8
  const pageNumber = p?.page_number ?? 0

  return {
    ...p,
    page_size: pageSize,
    page_number: pageNumber,
  } as T & { page_size: number; page_number: number };
};