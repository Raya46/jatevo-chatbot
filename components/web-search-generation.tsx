"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Search,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type WebSearchResult = {
  query: string;
  content: string;
  hasCitations: boolean;
  sources?: Array<{ title: string; url: string }>;
  success: boolean;
  timestamp: string;
};

type WebSearchGenerationProps = {
  result: WebSearchResult;
};

export function WebSearchGeneration({ result }: WebSearchGenerationProps) {
  const [expandedSources, setExpandedSources] = useState(false);

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border bg-background p-4 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
    >
      <div className="mb-3 flex items-center gap-2">
        <Search className="size-4 text-green-500" />
        <span className="font-medium text-muted-foreground text-sm">
          Web Search Results
        </span>
        {result.success ? (
          <CheckCircle className="size-4 text-green-500" />
        ) : (
          <AlertCircle className="size-4 text-red-500" />
        )}
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <Clock className="size-3" />
          {new Date(result.timestamp).toLocaleTimeString()}
        </div>
      </div>

      <div className="space-y-3">
        {/* Query display */}
        <div className="rounded-md bg-muted p-3">
          <div className="mb-1 font-medium text-muted-foreground text-xs">
            Search Query:
          </div>
          <div className="font-medium text-sm">{result.query}</div>
        </div>

        {/* Search content */}
        <div className="space-y-2">
          <div className="font-medium text-muted-foreground text-sm">
            {result.success ? "Search Results:" : "Search Error:"}
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {result.content}
          </div>
        </div>

        {/* Sources section */}
        {result.success &&
          result.hasCitations &&
          result.sources &&
          result.sources.length > 0 && (
            <div className="border-t pt-3">
              <Button
                className="mb-2 h-auto p-0 font-medium text-muted-foreground text-xs hover:text-foreground"
                onClick={() => setExpandedSources(!expandedSources)}
                size="sm"
                variant="ghost"
              >
                {expandedSources ? "Hide" : "Show"} Sources (
                {result.sources.length})
              </Button>

              {expandedSources && (
                <div className="space-y-2">
                  {result.sources.map((source, index) => (
                    <div
                      className="flex items-start gap-2 rounded-md border p-2 text-xs"
                      key={`${source.url}-${index}`}
                    >
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">
                          {source.title}
                        </div>
                        <a
                          className="mt-1 flex items-center gap-1 text-blue-500 hover:text-blue-600"
                          href={source.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <ExternalLink className="size-3" />
                          Visit Source
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        {/* No sources indicator */}
        {result.success && !result.hasCitations && (
          <div className="border-t pt-3">
            <div className="text-muted-foreground text-xs italic">
              No specific sources were cited for this result.
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
