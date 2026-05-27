import type React from 'react'

export type Theme = Record<string, string>

export function applyTheme(theme: Theme): React.CSSProperties {
  return theme as React.CSSProperties
}

export const direction1Light: Theme = {
  '--background': '0 0% 100%', '--foreground': '216 100% 22%',
  '--primary': '210 100% 39%', '--primary-foreground': '0 0% 100%',
  '--secondary': '185 66% 49%', '--secondary-foreground': '216 100% 22%',
  '--muted': '210 47% 94%', '--muted-foreground': '215 25% 45%',
  '--accent': '194 84% 53%', '--accent-foreground': '216 100% 22%',
  '--destructive': '18 100% 48%', '--destructive-foreground': '0 0% 100%',
  '--card': '0 0% 100%', '--card-foreground': '216 100% 22%',
  '--border': '210 30% 88%', '--radius': '0.375rem',
}

export const direction1Dark: Theme = {
  '--background': '216 100% 10%', '--foreground': '0 0% 95%',
  '--primary': '210 100% 55%', '--primary-foreground': '0 0% 100%',
  '--secondary': '185 60% 40%', '--secondary-foreground': '0 0% 100%',
  '--muted': '216 60% 16%', '--muted-foreground': '215 30% 60%',
  '--accent': '194 84% 53%', '--accent-foreground': '216 100% 10%',
  '--destructive': '18 100% 55%', '--destructive-foreground': '0 0% 100%',
  '--card': '216 80% 13%', '--card-foreground': '0 0% 95%',
  '--border': '216 40% 22%', '--radius': '0.375rem',
}

export const direction2Light: Theme = {
  '--background': '0 0% 100%', '--foreground': '210 100% 25%',
  '--primary': '210 100% 39%', '--primary-foreground': '0 0% 100%',
  '--secondary': '194 84% 40%', '--secondary-foreground': '0 0% 100%',
  '--muted': '210 40% 96%', '--muted-foreground': '210 30% 45%',
  '--accent': '62 100% 42%', '--accent-foreground': '216 100% 15%',
  '--destructive': '18 100% 48%', '--destructive-foreground': '0 0% 100%',
  '--card': '0 0% 100%', '--card-foreground': '210 100% 25%',
  '--border': '210 30% 88%', '--radius': '0.5rem',
}

export const direction2Dark: Theme = {
  '--background': '210 100% 14%', '--foreground': '0 0% 100%',
  '--primary': '194 84% 53%', '--primary-foreground': '210 100% 14%',
  '--secondary': '62 100% 47%', '--secondary-foreground': '216 100% 15%',
  '--muted': '210 100% 20%', '--muted-foreground': '210 50% 70%',
  '--accent': '185 66% 49%', '--accent-foreground': '210 100% 14%',
  '--destructive': '18 100% 55%', '--destructive-foreground': '0 0% 100%',
  '--card': '210 100% 18%', '--card-foreground': '0 0% 100%',
  '--border': '210 50% 28%', '--radius': '0.5rem',
}

export const direction3Light: Theme = {
  '--background': '210 30% 98%', '--foreground': '216 100% 17%',
  '--primary': '210 100% 39%', '--primary-foreground': '0 0% 100%',
  '--secondary': '185 66% 42%', '--secondary-foreground': '0 0% 100%',
  '--muted': '210 30% 93%', '--muted-foreground': '216 30% 40%',
  '--accent': '194 84% 45%', '--accent-foreground': '216 100% 10%',
  '--destructive': '18 100% 48%', '--destructive-foreground': '0 0% 100%',
  '--card': '0 0% 100%', '--card-foreground': '216 100% 17%',
  '--border': '216 20% 85%', '--radius': '0.25rem',
}

export const direction3Dark: Theme = {
  '--background': '216 100% 10%', '--foreground': '0 0% 100%',
  '--primary': '210 100% 52%', '--primary-foreground': '0 0% 100%',
  '--secondary': '185 66% 45%', '--secondary-foreground': '216 100% 10%',
  '--muted': '216 100% 15%', '--muted-foreground': '215 30% 62%',
  '--accent': '194 84% 53%', '--accent-foreground': '216 100% 10%',
  '--destructive': '18 100% 52%', '--destructive-foreground': '0 0% 100%',
  '--card': '216 100% 13%', '--card-foreground': '0 0% 100%',
  '--border': '215 40% 24%', '--radius': '0.25rem',
}
