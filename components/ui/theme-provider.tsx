"use client"

import * as React from "react"

interface ProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ProviderProps) {
  return <>{children}</>
} 