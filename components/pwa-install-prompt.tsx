"use client";

import { Apple, Download, Monitor, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Regex pattern at top level for performance
const IOS_DEVICE_REGEX = /(iPad|iPhone|iPod)/;

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [installStatus, setInstallStatus] = useState<
    "idle" | "installing" | "installed"
  >("idle");

  useEffect(() => {
    // Check if device is iOS
    const isIOSDevice =
      IOS_DEVICE_REGEX.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if app is already installed
    const isStandaloneMode = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    setIsStandalone(isStandaloneMode);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setInstallStatus("installed");
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowDialog(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    setInstallStatus("installing");

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setInstallStatus("installed");
      } else {
        setInstallStatus("idle");
      }

      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error("Error during installation:", error);
      setInstallStatus("idle");
    }
  };

  const handleIOSInstall = () => {
    setShowDialog(true);
  };

  // Don't show if already installed
  if (isStandalone || installStatus === "installed") {
    return null;
  }

  // Show native install button for supported browsers
  if (isInstallable && deferredPrompt && !isIOS) {
    return (
      <div className="fixed right-4 bottom-4 z-50">
        <div className="max-w-sm rounded-lg border border-border bg-background p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div
                aria-label="Jatevo Chatbot"
                className="h-12 w-12 rounded-lg bg-center bg-cover"
                role="img"
                style={{ backgroundImage: 'url("/jatevo.png")' }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm">Install Jatevo Chatbot</p>
              <p className="text-muted-foreground text-xs">
                Get the full experience on your device
              </p>
            </div>
            <Button
              className="flex-shrink-0"
              disabled={installStatus === "installing"}
              onClick={handleInstallClick}
              size="sm"
            >
              {installStatus === "installing" ? (
                "Installing..."
              ) : (
                <>
                  <Download className="mr-1 h-4 w-4" />
                  Install
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show iOS install instructions
  if (isIOS && !isStandalone) {
    return (
      <div className="fixed right-4 bottom-4 z-50">
        <Dialog onOpenChange={setShowDialog} open={showDialog}>
          <DialogTrigger asChild>
            <Button
              className="flex items-center gap-2 shadow-lg"
              onClick={handleIOSInstall}
            >
              <Apple className="h-4 w-4" />
              Install App
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Install on iOS Device
              </DialogTitle>
              <DialogDescription>
                Follow these steps to install Jatevo Chatbot on your iOS device:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-sm">
                  1
                </div>
                <p className="text-sm">
                  Tap the share button
                  <span
                    aria-label="share icon"
                    className="mx-2 inline-block"
                    role="img"
                  >
                    ⎋
                  </span>
                  at the bottom of the screen
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-sm">
                  2
                </div>
                <p className="text-sm">
                  Scroll down and tap "Add to Home Screen"
                  <span
                    aria-label="plus icon"
                    className="mx-2 inline-block"
                    role="img"
                  >
                    ➕
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-sm">
                  3
                </div>
                <p className="text-sm">
                  Tap "Add" to install the app on your home screen
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span className="font-medium text-sm">Benefits</span>
                </div>
                <ul className="space-y-1 text-muted-foreground text-xs">
                  <li>• Faster loading times</li>
                  <li>• Offline access</li>
                  <li>• Native app experience</li>
                  <li>• Push notifications</li>
                </ul>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setShowDialog(false)}>
                  Got it, thanks!
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}
