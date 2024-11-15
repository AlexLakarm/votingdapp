"use client"

export function Web3Provider({ children }: { children: React.ReactNode }) {
  if (typeof window !== 'undefined' && !window.ethereum) {
    Object.defineProperty(window, 'ethereum', {
      value: {},
      writable: true,
      configurable: true
    })
  }

  return <>{children}</>
} 