'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  isDark: true,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const stored = localStorage.getItem('sf-theme') as Theme | null
    if (stored) setTheme(stored)
  }, [])

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('sf-theme', next)
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

// ── Centralised token maps ────────────────────────────────────────────────────
// Every colour used in the UI is derived from these tokens.
// Dark values  → exactly what the current codebase uses
// Light values → a clean editorial white/off-white palette

export function t(isDark: boolean) {
  return {
    // Page / shell
    // Light: crisp white page so cards/borders read clearly
    pageBg:       isDark ? 'bg-black'        : 'bg-[#f0eeeb]',
    pageBgRaw:    isDark ? '#000000'          : '#f0eeeb',

    // Surfaces (cards, panels, inputs)
    // Light: pure white so they pop against the off-white page
    surface:      isDark ? 'bg-[#0a0a0a]'    : 'bg-white',
    surfaceHover: isDark ? 'hover:bg-[#0a0a0a]' : 'hover:bg-[#fafaf8]',

    // Borders / dividers
    // Light: noticeably darker so lines are legible
    border:       isDark ? 'border-[#1a1a1a]' : 'border-[#d1cdc7]',
    borderRaw:    isDark ? '#1a1a1a'           : '#d1cdc7',
    divide:       isDark ? 'divide-[#1a1a1a]' : 'divide-[#d1cdc7]',

    // Text — punched up at every level
    // primary:  near-black
    // sub:      dark stone (readable body copy)
    // muted:    medium stone (labels, captions — was too light before)
    // ghost:    light stone (decorative only — index numbers, dividers)
    textPrimary:  isDark ? 'text-white'       : 'text-[#1c1917]',
    textSub:      isDark ? 'text-[#6A6A6A]'  : 'text-[#44403c]',
    textMuted:    isDark ? 'text-[#3E3E3E]'  : 'text-[#78716c]',
    textGhost:    isDark ? 'text-[#282828]'  : 'text-[#a8a29e]',

    // Inputs
    // Light: white bg, visible border, dark text, legible placeholder
    inputBg:          isDark ? 'bg-[#0a0a0a]'    : 'bg-white',
    inputBorder:      isDark ? 'border-[#1a1a1a]' : 'border-[#d1cdc7]',
    inputText:        isDark ? 'text-white'        : 'text-[#1c1917]',
    inputPlaceholder: isDark ? 'placeholder-[#282828]' : 'placeholder-[#a8a29e]',
    inputFocus:       isDark
      ? 'focus:ring-[#E8192C]/40 focus:border-[#E8192C]/60'
      : 'focus:ring-[#E8192C]/30 focus:border-[#E8192C]/60',

    // Nav / sidebar — white so they contrast against the off-white page bg
    navBg:     isDark ? 'bg-black' : 'bg-white',
    sidebarBg: isDark ? 'bg-black' : 'bg-white',

    // Sidebar item states
    sidebarActive:      isDark ? 'text-white'      : 'text-[#1c1917]',
    sidebarInactive:    isDark ? 'text-[#3E3E3E]'  : 'text-[#78716c]',
    sidebarHoverText:   isDark ? 'hover:text-white' : 'hover:text-[#1c1917]',
    sidebarIndexActive: isDark ? 'text-[#E8192C]'  : 'text-[#E8192C]',
    sidebarIndexIdle:   isDark ? 'text-[#282828]'  : 'text-[#a8a29e]',

    // Accents (unchanged in both themes)
    red:        '#E8192C',
    redHover:   '#FF1F30',
    amber:      '#F5A623',
    amberDim:   isDark ? 'text-[#3E3E3E]' : 'text-[#78716c]',
    amberHover: 'hover:text-[#F5A623]',

    // Misc
    spinner:    isDark ? 'border-[#E8192C]' : 'border-[#E8192C]',
    dashed:     isDark ? 'border-[#1a1a1a]' : 'border-[#d1cdc7]',
    tooltipBg:  isDark ? 'bg-black border-[#1a1a1a]' : 'bg-white border-[#d1cdc7]',
    tooltipText: isDark ? 'text-white' : 'text-[#1c1917]',
  }
}