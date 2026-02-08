"use client";

import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Filter } from "lucide-react";
import { ProductFilters } from "@/hooks/use-product-filters";
import { useState } from "react";

const WELLNESS_GOALS = ["Energy", "Sleep", "Recovery", "Focus", "Relaxation", "Immunity"];
const INGREDIENTS = ["CBD", "Melatonin", "Magnesium", "Vitamin C", "Vitamin D", "Zinc", "Ashwagandha", "Turmeric"];

interface FilterSidebarProps {
  filters: ProductFilters;
  onFilterChange: <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
}

function currency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

/**
 * FilterSidebar component for product filtering
 * - Desktop: Always-visible sidebar with filters
 * - Mobile: Collapsible dialog with filter toggle button
 * - Price range slider with min/max values
 * - Wellness goals checkboxes
 * - Ingredients checkboxes
 * - Availability radio buttons
 * - Clear all filters button
 * - Filter count display
 */
export function FilterSidebar({ filters, onFilterChange, onClearFilters, activeFilterCount }: FilterSidebarProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const handlePriceRangeChange = (values: number[]) => {
    onFilterChange("minPrice", values[0]);
    onFilterChange("maxPrice", values[1]);
  };

  const toggleWellnessGoal = (goal: string) => {
    const currentGoals = filters.wellnessGoals || [];
    const updatedGoals = currentGoals.includes(goal)
      ? currentGoals.filter((g) => g !== goal)
      : [...currentGoals, goal];
    onFilterChange("wellnessGoals", updatedGoals);
  };

  const toggleIngredient = (ingredient: string) => {
    const currentIngredients = filters.ingredients || [];
    const updatedIngredients = currentIngredients.includes(ingredient)
      ? currentIngredients.filter((i) => i !== ingredient)
      : [...currentIngredients, ingredient];
    onFilterChange("ingredients", updatedIngredients);
  };

  const handleApplyFilters = () => {
    setMobileFiltersOpen(false);
  };

  const handleClearAndClose = () => {
    onClearFilters();
    setMobileFiltersOpen(false);
  };

  // Mobile filter button
  const MobileFilterButton = () => (
    <Button
      onClick={() => setMobileFiltersOpen(true)}
      variant="outline"
      className="lg:hidden flex items-center gap-2 w-full sm:w-auto"
    >
      <Filter className="h-4 w-4" />
      Filters
      {activeFilterCount > 0 && (
        <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
          {activeFilterCount}
        </span>
      )}
    </Button>
  );

  // Filter content (shared between desktop and mobile)
  const FilterContent = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">
          Filter <span className="text-muted-foreground font-normal text-sm ml-1">({activeFilterCount})</span>
        </h2>
        {activeFilterCount > 0 && (
          <button
            onClick={onClearFilters}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="bg-[#f9f9f9] rounded-2xl p-6 space-y-6">
        {/* Price Range */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold">Price Range</h3>
          <div className="space-y-3">
            <Slider
              defaultValue={[0, 500]}
              min={0}
              max={500}
              step={10}
              value={[
                filters.minPrice ?? 0,
                filters.maxPrice ?? 500
              ]}
              onValueChange={handlePriceRangeChange}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{currency(filters.minPrice ?? 0)}</span>
              <span>{currency(filters.maxPrice ?? 500)}</span>
            </div>
          </div>
        </div>

        {/* Wellness Goals */}
        <Accordion type="multiple" defaultValue={["wellness-goals"]} className="space-y-4">
          <AccordionItem value="wellness-goals" className="border-b-0">
            <AccordionTrigger className="py-0 text-sm font-bold hover:no-underline">
              <span className="flex items-center gap-2">
                Wellness Goals
                {(filters.wellnessGoals?.length ?? 0) > 0 && (
                  <span className="text-muted-foreground font-normal text-xs">
                    ({filters.wellnessGoals?.length})
                  </span>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-0 pt-4">
              <div className="flex flex-col gap-3">
                {WELLNESS_GOALS.map((goal) => (
                  <label
                    key={goal}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <Checkbox
                      checked={filters.wellnessGoals?.includes(goal) ?? false}
                      onCheckedChange={() => toggleWellnessGoal(goal)}
                      className="shrink-0"
                    />
                    <span className={`text-sm transition-colors ${
                      filters.wellnessGoals?.includes(goal)
                        ? "font-bold text-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}>
                      {goal}
                    </span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Ingredients */}
          <AccordionItem value="ingredients" className="border-b-0">
            <AccordionTrigger className="py-0 text-sm font-bold hover:no-underline">
              <span className="flex items-center gap-2">
                Ingredients
                {(filters.ingredients?.length ?? 0) > 0 && (
                  <span className="text-muted-foreground font-normal text-xs">
                    ({filters.ingredients?.length})
                  </span>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-0 pt-4">
              <div className="flex flex-col gap-3">
                {INGREDIENTS.map((ingredient) => (
                  <label
                    key={ingredient}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <Checkbox
                      checked={filters.ingredients?.includes(ingredient) ?? false}
                      onCheckedChange={() => toggleIngredient(ingredient)}
                      className="shrink-0"
                    />
                    <span className={`text-sm transition-colors ${
                      filters.ingredients?.includes(ingredient)
                        ? "font-bold text-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}>
                      {ingredient}
                    </span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Availability */}
          <AccordionItem value="availability" className="border-b-0">
            <AccordionTrigger className="py-0 text-sm font-bold hover:no-underline">
              <span className="flex items-center gap-2">
                Availability
                {filters.availability && (
                  <span className="text-muted-foreground font-normal text-xs">(1)</span>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-0 pt-4">
              <div className="flex flex-col gap-3">
                {[
                  { value: "in" as const, label: "In Stock" },
                  { value: "low" as const, label: "Low Stock" },
                  { value: "out" as const, label: "Out of Stock" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <Checkbox
                      checked={filters.availability === option.value}
                      onCheckedChange={(checked) => {
                        onFilterChange(
                          "availability",
                          checked ? option.value : null
                        );
                      }}
                      className="shrink-0"
                    />
                    <span className={`text-sm transition-colors ${
                      filters.availability === option.value
                        ? "font-bold text-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile filter button */}
      <MobileFilterButton />

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-full lg:w-64 space-y-10 shrink-0">
        <FilterContent />
      </aside>

      {/* Mobile filter dialog */}
      <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <FilterContent />
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleClearAndClose}
                variant="outline"
                className="flex-1"
              >
                Clear All
              </Button>
              <Button
                onClick={handleApplyFilters}
                className="flex-1"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
