"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { Download } from "lucide-react"
import { toast } from "sonner"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type PwaInstallState = {
  /** Kan de installatie programmatisch gestart worden (o.a. Android/Chrome, desktop Chrome/Edge). */
  installable: boolean
  /** De app draait al als geïnstalleerde standalone-app. */
  installed: boolean
  /** iOS/Safari geeft geen installatieprompt; hier moet een handmatige instructie getoond worden. */
  isIos: boolean
  /** Start de installatie (alleen zinvol wanneer installable === true). */
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">
}

const PwaInstallContext = createContext<PwaInstallState | null>(null)

export function usePwaInstall() {
  const context = useContext(PwaInstallContext)
  if (!context) {
    throw new Error("usePwaInstall moet binnen PwaInstallProvider gebruikt worden")
  }
  return context
}

function detecteerStandalone() {
  if (typeof window === "undefined") return false
  const mediaMatch = window.matchMedia?.("(display-mode: standalone)").matches
  // iOS Safari: geen matchMedia-ondersteuning voor display-mode, wel navigator.standalone
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true
  return Boolean(mediaMatch || iosStandalone)
}

function detecteerIos() {
  if (typeof window === "undefined") return false
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !("MSStream" in window)
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)
  const toastGetoond = useRef(false)

  const [installable, setInstallable] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Stil falen: PWA-functionaliteit is een verbetering, geen vereiste.
      })
    }

    setInstalled(detecteerStandalone())
    setIsIos(detecteerIos())

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      deferredPrompt.current = event as BeforeInstallPromptEvent
      setInstallable(true)

      if (toastGetoond.current) return
      toastGetoond.current = true

      toast("Installeer Billenboek", {
        description: "Zet de app op je startscherm voor snelle toegang.",
        duration: 10000,
        action: {
          label: "Installeren",
          onClick: () => {
            void promptInstall()
          },
        },
        icon: <Download className="size-4" />,
      })
    }

    function onAppInstalled() {
      setInstalled(true)
      setInstallable(false)
      deferredPrompt.current = null
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onAppInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onAppInstalled)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
    const prompt = deferredPrompt.current
    if (!prompt) return "unavailable"

    await prompt.prompt()
    const { outcome } = await prompt.userChoice

    if (outcome === "accepted") {
      setInstallable(false)
      deferredPrompt.current = null
    }

    return outcome
  }

  return (
    <PwaInstallContext.Provider value={{ installable, installed, isIos, promptInstall }}>
      {children}
    </PwaInstallContext.Provider>
  )
}
