"use client";

import { Apple, Download, Monitor, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [installStatus, setInstallStatus] = useState<
    "idle" | "installing" | "installed"
  >("idle");
  const [isDismissed, setIsDismissed] = useState(false);

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

    // Check if user has dismissed the banner
    const dismissed = localStorage.getItem("pwa-install-dismissed") === "true";
    setIsDismissed(dismissed);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setInstallStatus("installed");
      setDeferredPrompt(null);
      setShowDialog(false);
      // Also dismiss banner after install
      localStorage.setItem("pwa-install-dismissed", "true");
      setIsDismissed(true);
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
    if (isIOS) {
      // For iOS, open dialog with instructions
      setShowDialog(true);
      return;
    }

    if (!deferredPrompt) {
      // If no deferred prompt (non-installable browser), maybe open generic instructions?
      setShowDialog(true);
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
    } catch (error) {
      console.error("Error during installation:", error);
      setInstallStatus("idle");
    }
  };

  const handleClose = () => {
    setIsDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  // Don't show if already installed or dismissed
  if (isStandalone || installStatus === "installed" || isDismissed) {
    return null;
  }

  // Unified banner for all devices
  return (
    <>
      <div className="fixed top-0 right-0 left-0 z-50 border-border border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              aria-label="Jatevo Chatbot"
              className="h-8 w-8 rounded-lg bg-center bg-cover"
              role="img"
              style={{ backgroundImage: 'url("/jatevo.png")' }}
            />
            <div>
              <p className="font-medium text-sm">Install Jatevo Chatbot</p>
              <p className="flex items-center gap-1 text-muted-foreground text-xs">
                tap <Download className="h-3 w-3" /> then add to home screen
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              disabled={installStatus === "installing"}
              onClick={handleInstallClick}
              size="sm"
            >
              {installStatus === "installing" ? (
                "Installing..."
              ) : isIOS ? (
                <>
                  <Apple className="mr-1 h-4 w-4" />
                  Install
                </>
              ) : (
                <>
                  <Download className="mr-1 h-4 w-4" />
                  Install
                </>
              )}
            </Button>
            <Button
              aria-label="Close"
              className="h-8 w-8"
              onClick={handleClose}
              size="icon"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog for iOS (and fallback instructions) */}
      <Dialog onOpenChange={setShowDialog} open={showDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              {isIOS ? "Install on iOS Device" : "Install App"}
            </DialogTitle>
            <DialogDescription>
              {isIOS
                ? "Follow these steps to install Jatevo Chatbot on your iOS device:"
                : "Follow these steps to install Jatevo Chatbot on your device:"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isIOS ? (
              <>
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
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-sm">
                    1
                  </div>
                  <p className="text-sm">
                    Tap the install button in the banner above
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-sm">
                    2
                  </div>
                  <p className="text-sm">
                    Follow the browser prompts to add the app to your home
                    screen
                  </p>
                </div>
              </>
            )}
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
    </>
  );
}
