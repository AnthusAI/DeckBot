import { useEffect, useState } from 'react'
import logoLight from '@/assets/deckbot-logo-light.png'
import logoDark from '@/assets/deckbot-logo-dark.png'

interface ThemedLogoProps {
  className?: string
  alt?: string
  style?: React.CSSProperties
}

export function ThemedLogo({ className = '', alt = 'DeckBot Logo', style }: ThemedLogoProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme')
      setIsDark(theme === 'dark')
    }

    checkTheme()

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => observer.disconnect()
  }, [])

  return (
    <img
      src={isDark ? logoDark : logoLight}
      alt={alt}
      className={className}
      style={style}
    />
  )
}

