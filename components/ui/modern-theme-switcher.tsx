"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Monitor, Moon, Sun } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export type ThemeConfig = {
  name: string
  label: string
  colors: {
    background: string
    foreground: string
    primary: string
    secondary: string
    accent: string
    muted: string
    border: string
  }
}

const themes: ThemeConfig[] = [
  {
    name: "light",
    label: "라이트 모드",
    colors: {
      background: "bg-white",
      foreground: "text-gray-900",
      primary: "bg-blue-600 text-purple-800",
      secondary: "bg-gray-100 text-gray-800",
      accent: "bg-gradient-to-r from-indigo-500 to-blue-500 text-purple-800",
      muted: "bg-gray-100 text-gray-600",
      border: "border-gray-200",
    },
  },
  {
    name: "dark",
    label: "다크 모드",
    colors: {
      background: "bg-gray-950",
      foreground: "text-gray-50",
      primary: "bg-blue-500 text-purple-800",
      secondary: "bg-gray-800 text-gray-100",
      accent: "bg-gradient-to-r from-blue-800 to-indigo-900 text-purple-800",
      muted: "bg-gray-800 text-gray-300",
      border: "border-gray-700",
    },
  },
  {
    name: "system",
    label: "시스템 설정",
    colors: {
      background: "bg-purple-50",
      foreground: "text-foreground",
      primary: "bg-primary text-primary-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      accent: "bg-gradient-to-r from-purple-200 via-violet-400 to-indigo-600 text-purple-800",
      muted: "bg-muted text-muted-foreground",
      border: "border-border",
    },
  },
]

export interface ThemeSwitcherProps {
  className?: string
}

export function ModernThemeSwitcher({ className }: ThemeSwitcherProps) {
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme } = useTheme()
  const [systemTheme, setSystemTheme] = React.useState<"dark" | "light">("light")

  React.useEffect(() => {
    setMounted(true)
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    setSystemTheme(media.matches ? "dark" : "light")

    const listener = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light")
    }

    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [])

  if (!mounted) return null

  return (
    <div className="bg-background border border-border rounded-lg p-6 shadow-lg">
      <h2 className="text-foreground text-xl font-bold mb-2">테마 설정</h2>
      <p className="text-muted-foreground mb-6">
        다크 모드와 라이트 모드에서 모두 텍스트가 잘 보이는 모던한 테마를 선택하세요.
      </p>
      
      <div className="grid gap-4 md:grid-cols-3">
        {themes.map((themeOption) => {
          const isSelected = theme === themeOption.name
          const currentTheme = themeOption.name === "system" ? systemTheme : themeOption.name
          
          return (
            <div
              key={themeOption.name}
              className={cn(
                "relative rounded-lg border p-4 transition-all cursor-pointer",
                isSelected ? "ring-2 ring-blue-500" : "hover:border-blue-300",
                themeOption.colors.border
              )}
              onClick={() => setTheme(themeOption.name)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {themeOption.name === "light" && <Sun className="h-5 w-5 text-amber-500" />}
                  {themeOption.name === "dark" && <Moon className="h-5 w-5 text-indigo-400" />}
                  {themeOption.name === "system" && <Monitor className="h-5 w-5 text-gray-500" />}
                  <span className="font-medium text-foreground">{themeOption.label}</span>
                </div>
                <div className="h-4 w-4 rounded-full border flex items-center justify-center">
                  {isSelected && (
                    <motion.div
                      layoutId="selectedTheme"
                      className="h-2 w-2 rounded-full bg-blue-500"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className={cn("h-8 rounded", themeOption.colors.primary)}></div>
                <div className={cn("h-8 rounded", themeOption.colors.secondary)}></div>
                <div className={cn("h-8 rounded col-span-2", themeOption.colors.accent)}></div>
                <div className={cn("h-8 rounded", themeOption.colors.muted)}></div>
                <div className={cn("h-8 rounded border", themeOption.colors.border)}></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 