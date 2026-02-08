"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export interface ProductFilters {
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  wellnessGoals: string[];
  ingredients: string[];
  availability: "in" | "low" | "out" | null;
  sortBy: "price" | "popularity" | "rating" | "newest";
  order: "asc" | "desc";
}

const DEFAULT_FILTERS: ProductFilters = {
  category: null,
  minPrice: null,
  maxPrice: null,
  wellnessGoals: [],
  ingredients: [],
  availability: null,
  sortBy: "newest",
  order: "desc",
};

/**
 * Hook for managing product filter state via URL search parameters.
 * Provides read/write access to filters and keeps URL in sync with filter state.
 *
 * @example
 * const { filters, setFilter, setFilters, clearFilters, hasActiveFilters } = useProductFilters();
 *
 * // Set a single filter
 * setFilter("category", "Chairs");
 *
 * // Set multiple filters at once
 * setFilters({ category: "Chairs", minPrice: 0, maxPrice: 100 });
 *
 * // Clear all filters
 * clearFilters();
 */
export function useProductFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Parse current filters from URL search parameters
   */
  const getFilters = useCallback((): ProductFilters => {
    return {
      category: searchParams.get("category"),
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null,
      wellnessGoals: searchParams.get("wellnessGoals")
        ? searchParams.get("wellnessGoals")!.split(",").filter(Boolean)
        : [],
      ingredients: searchParams.get("ingredients")
        ? searchParams.get("ingredients")!.split(",").filter(Boolean)
        : [],
      availability: searchParams.get("availability") as "in" | "low" | "out" | null,
      sortBy: (searchParams.get("sortBy") as ProductFilters["sortBy"]) || "newest",
      order: (searchParams.get("order") as ProductFilters["order"]) || "desc",
    };
  }, [searchParams]);

  /**
   * Update URL with new filter parameters
   */
  const updateUrl = useCallback(
    (params: URLSearchParams) => {
      const search = params.toString();
      const query = search ? `?${search}` : "";
      router.replace(`${pathname}${query}`, { scroll: false });
    },
    [pathname, router]
  );

  /**
   * Set a single filter value
   */
  const setFilter = useCallback(
    <K extends keyof ProductFilters>(
      key: K,
      value: ProductFilters[K]
    ) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.set(key, value.join(","));
      } else {
        params.set(key, String(value));
      }

      updateUrl(params);
    },
    [searchParams, updateUrl]
  );

  /**
   * Set multiple filters at once
   */
  const setFilters = useCallback(
    (updates: Partial<ProductFilters>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.set(key, value.join(","));
        } else {
          params.set(key, String(value));
        }
      });

      updateUrl(params);
    },
    [searchParams, updateUrl]
  );

  /**
   * Clear all filters and reset to defaults
   */
  const clearFilters = useCallback(() => {
    const params = new URLSearchParams();

    // Set default sorting
    params.set("sortBy", DEFAULT_FILTERS.sortBy);
    params.set("order", DEFAULT_FILTERS.order);

    updateUrl(params);
  }, [updateUrl]);

  /**
   * Check if any non-default filters are active
   */
  const hasActiveFilters = useCallback((): boolean => {
    const filters = getFilters();
    return (
      filters.category !== null ||
      filters.minPrice !== null ||
      filters.maxPrice !== null ||
      filters.wellnessGoals.length > 0 ||
      filters.ingredients.length > 0 ||
      filters.availability !== null
    );
  }, [getFilters]);

  /**
   * Get the count of active filters
   */
  const getActiveFilterCount = useCallback((): number => {
    const filters = getFilters();
    let count = 0;
    if (filters.category) count++;
    if (filters.minPrice !== null) count++;
    if (filters.maxPrice !== null) count++;
    if (filters.wellnessGoals.length > 0) count++;
    if (filters.ingredients.length > 0) count++;
    if (filters.availability) count++;
    return count;
  }, [getFilters]);

  const filters = getFilters();

  return {
    filters,
    setFilter,
    setFilters,
    clearFilters,
    hasActiveFilters,
    getActiveFilterCount,
  };
}
