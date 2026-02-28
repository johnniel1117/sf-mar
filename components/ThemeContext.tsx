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
    // Page / shell — warm mid-tone, not white, not cream
    pageBg:    isDark ? 'bg-black'     : 'bg-[#e8e4df]',
    pageBgRaw: isDark ? '#000000'      : '#e8e4df',

    // Surfaces — lighter than page so cards lift off the background
    surface:      isDark ? 'bg-[#0a0a0a]'       : 'bg-[#f2f0ed]',
    surfaceHover: isDark ? 'hover:bg-[#0a0a0a]' : 'hover:bg-[#eeebe7]',

    // Borders / dividers — dark enough to always be visible
    border:    isDark ? 'border-[#1a1a1a]' : 'border-[#c4bfb8]',
    borderRaw: isDark ? '#1a1a1a'           : '#c4bfb8',
    divide:    isDark ? 'divide-[#1a1a1a]' : 'divide-[#c4bfb8]',

    // Text — full contrast stack
    textPrimary: isDark ? 'text-white'      : 'text-[#1c1917]',
    textSub:     isDark ? 'text-[#9A9A9A]' : 'text-[#3d3834]',
    textMuted:   isDark ? 'text-[#9A9A9A]' : 'text-[#6b6460]',
    textGhost:   isDark ? 'text-[#5A5A5A]' : 'text-[#9e9890]',

    // Inputs — slightly lighter than surface so they feel interactive
    inputBg:          isDark ? 'bg-[#0a0a0a]'        : 'bg-[#f7f5f2]',
    inputBorder:      isDark ? 'border-[#1a1a1a]'    : 'border-[#c4bfb8]',
    inputText:        isDark ? 'text-white'            : 'text-[#1c1917]',
    inputPlaceholder: isDark ? 'placeholder-[#282828]': 'placeholder-[#9e9890]',
    inputFocus:       isDark
      ? 'focus:ring-[#E8192C]/40 focus:border-[#E8192C]/60'
      : 'focus:ring-[#E8192C]/30 focus:border-[#E8192C]/60',

    // Nav / sidebar — same as surface so they feel part of the shell
    navBg:     isDark ? 'bg-black' : 'bg-[#f2f0ed]',
    sidebarBg: isDark ? 'bg-black' : 'bg-[#f2f0ed]',

    // Sidebar item states
    sidebarActive:      isDark ? 'text-white'      : 'text-[#1c1917]',
    sidebarInactive:    isDark ? 'text-[#9A9A9A]'  : 'text-[#6b6460]',
    sidebarHoverText:   isDark ? 'hover:text-white' : 'hover:text-[#1c1917]',
    sidebarIndexActive: isDark ? 'text-[#E8192C]'  : 'text-[#E8192C]',
    sidebarIndexIdle:   isDark ? 'text-[#5A5A5A]'  : 'text-[#9e9890]',

    // Accents
    red:        '#E8192C',
    redHover:   '#FF1F30',
    amber:      '#F5A623',
    amberDim:   isDark ? 'text-[#9A9A9A]' : 'text-[#6b6460]',
    amberHover: 'hover:text-[#F5A623]',

    // Misc
    spinner:     isDark ? 'border-[#E8192C]'              : 'border-[#E8192C]',
    dashed:      isDark ? 'border-[#1a1a1a]'              : 'border-[#c4bfb8]',
    tooltipBg:   isDark ? 'bg-black border-[#1a1a1a]'     : 'bg-[#f2f0ed] border-[#c4bfb8]',
    tooltipText: isDark ? 'text-white'                     : 'text-[#1c1917]',
  }
}