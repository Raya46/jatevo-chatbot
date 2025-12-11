"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

type WebSearchResult = {
  id: string;
  query: string;
  content: string;
  hasCitations: boolean;
  sources?: Array<{ title: string; url: string }>;
  success: boolean;
  timestamp: string;
};

type WebSearchContextType = {
  webSearches: WebSearchResult[];
  addWebSearch: (search: Omit<WebSearchResult, "id" | "timestamp">) => void;
  clearWebSearches: () => void;
};

const WebSearchContext = createContext<WebSearchContextType | null>(null);

export function WebSearchProvider({ children }: { children: ReactNode }) {
  const [webSearches, setWebSearches] = useState<WebSearchResult[]>([]);

  const addWebSearch = (search: Omit<WebSearchResult, "id" | "timestamp">) => {
    const newSearch: WebSearchResult = {
      ...search,
      id: `web-search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    setWebSearches((prev) => [...prev, newSearch]);
  };

  const clearWebSearches = () => {
    setWebSearches([]);
  };

  return (
    <WebSearchContext.Provider
      value={{
        webSearches,
        addWebSearch,
        clearWebSearches,
      }}
    >
      {children}
    </WebSearchContext.Provider>
  );
}

export function useWebSearches() {
  const context = useContext(WebSearchContext);
  if (!context) {
    throw new Error("useWebSearches must be used within a WebSearchProvider");
  }
  return context;
}
