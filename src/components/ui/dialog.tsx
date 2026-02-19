import * as React from "react"

import { cn } from "@/lib/utils"
// We'll use a simple implementation if Radix isn't installed, but typically shadcn/ui uses radix.
// Since we don't have radix installed in package.json from the first step, we should implement a pure React Version 
// OR simpler: Install Radix. 
// However, to keep it simple and consistent with the "standalone" vibe, I'll build a custom one that mimics the API.

// Actually, let's just make a simple custom accessible dialog to avoid complex dependency chain edits for now
// unless user asked for shadcn specifically (which they did in the prompt implicity by using the imports).
// But for now, I will implement a custom lightweight version that matches the API.

const DialogContext = React.createContext<{ open: boolean; onOpenChange: (open: boolean) => void } | null>(null)

export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) {
    return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>
}

export function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
    const context = React.useContext(DialogContext)
    if (!context?.open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => context.onOpenChange(false)} />
            <div className={cn("relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200", className)}>
                {children}
                <button
                    onClick={() => context.onOpenChange(false)}
                    className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
                >
                    ✕
                </button>
            </div>
        </div>
    )
}

export function DialogHeader({ className, children }: { className?: string; children: React.ReactNode }) {
    return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>{children}</div>
}

export function DialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
    return <div className={cn("text-lg font-semibold leading-none tracking-tight", className)}>{children}</div>
}
