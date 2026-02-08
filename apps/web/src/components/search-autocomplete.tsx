"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getServerUrl } from "@/lib/server-url";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

type Suggestion = {
  id: string;
  name: string;
  category: string;
  image?: string;
};

interface SearchAutocompleteProps {
  placeholder?: string;
  className?: string;
}

/**
 * SearchAutocomplete component with dropdown suggestions.
 * - Fetches suggestions from /api/products/autocomplete endpoint
 * - Shows 5-10 relevant product suggestions as user types
 * - Supports keyboard navigation (arrow keys, enter, escape)
 * - Clicking suggestion navigates to /search?q=...
 */
export function SearchAutocomplete({
  placeholder = "Search products, collections...",
  className,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch autocomplete suggestions with debouncing (300ms delay)
  React.useEffect(() => {
    let mounted = true;

    async function fetchSuggestions() {
      if (!query.trim()) {
        setSuggestions([]);
        setIsOpen(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(
          `${getServerUrl()}/api/products/autocomplete?q=${encodeURIComponent(query)}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const data = (await res.json()) as { suggestions: Suggestion[] };
        if (!mounted) return;

        const results = data.suggestions ?? [];
        setSuggestions(results.slice(0, 10)); // Limit to 10 suggestions
        setIsOpen(results.length > 0);
        setSelectedIndex(-1);
      } catch (err) {
        if (!mounted) return;
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    // Clear existing timer and set new debounced timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      void fetchSuggestions();
    }, 300);

    return () => {
      mounted = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(suggestion: Suggestion) {
    setQuery(suggestion.name);
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(suggestion.name)}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Enter") {
        handleSubmit(e);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(suggestions[selectedIndex]);
        } else {
          handleSubmit(e);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.focus();
        break;
    }
  }

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            placeholder={placeholder}
            className="pr-10"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <Button type="submit" variant="ghost" size="sm" className="-ml-10">
          <Search className="w-4 h-4" />
        </Button>
      </form>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full max-h-96 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95"
        >
          <div className="p-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSelect(suggestion)}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:bg-accent focus:text-accent-foreground",
                  selectedIndex === index && "bg-accent text-accent-foreground"
                )}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex-1 text-left">
                  <div className="font-medium">{suggestion.name}</div>
                  {suggestion.category && (
                    <div className="text-xs text-muted-foreground">
                      {suggestion.category}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
