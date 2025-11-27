"use client";

import { Home, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <WifiOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">You're Offline</CardTitle>
          <CardDescription>
            It looks like you've lost your internet connection. Some features
            may not be available until you're back online.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <h3 className="mb-2 font-medium">Available Offline:</h3>
            <ul className="space-y-1 text-left text-muted-foreground">
              <li>• Previously viewed conversations</li>
              <li>• Cached images and content</li>
              <li>• App interface and navigation</li>
            </ul>
          </div>
          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <h3 className="mb-2 font-medium">Requires Internet:</h3>
            <ul className="space-y-1 text-left text-muted-foreground">
              <li>• New conversations</li>
              <li>• Image generation</li>
              <li>• AI responses</li>
              <li>• Real-time features</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <Button className="w-full" onClick={handleRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button className="w-full" onClick={handleGoHome} variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            This page will automatically refresh when your connection is
            restored.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
