import { useEffect, useRef, useState } from 'react'
import logoLight from '@/assets/deckbot-logo-light.png'
import logoDark from '@/assets/deckbot-logo-dark.png'

// Preload both images
const lightImg = new Image()
lightImg.src = logoLight
const darkImg = new Image()
darkImg.src = logoDark

export function LogoStripe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDark, setIsDark] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState(false)

  useEffect(() => {
    // Preload images
    let loadedCount = 0
    const checkLoaded = () => {
      loadedCount++
      if (loadedCount === 2) {
        setImagesLoaded(true)
      }
    }
    
    if (lightImg.complete) checkLoaded()
    else lightImg.onload = checkLoaded
    
    if (darkImg.complete) checkLoaded()
    else darkImg.onload = checkLoaded
  }, [])

  useEffect(() => {
    // Check theme
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

  useEffect(() => {
    if (!imagesLoaded) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas dimensions first
    canvas.width = window.innerWidth
    canvas.height = 128

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const img = isDark ? darkImg : lightImg
    
    console.log('Drawing stripe for', isDark ? 'dark' : 'light', 'mode')
    console.log('Image loaded successfully. Dimensions:', img.width, 'x', img.height)
    
    // Create a temporary canvas to load the image
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })
    if (!tempCtx) {
      console.error('Failed to get temp canvas context')
      return
    }

    // Scale image to 128px height
    const scaleFactor = 128 / img.height
    const scaledWidth = img.width * scaleFactor
    tempCanvas.width = Math.ceil(scaledWidth)
    tempCanvas.height = 128
    
    console.log('Temp canvas size:', tempCanvas.width, 'x', tempCanvas.height)
    
    // Draw the image on temp canvas
    tempCtx.drawImage(img, 0, 0, tempCanvas.width, 128)

    // Extract the leftmost column (1px wide, full height)
    const leftColumn = tempCtx.getImageData(0, 0, 1, 128)
    
    console.log('Extracted left column, pixel data length:', leftColumn.data.length)
    console.log('First few pixels (RGBA):', Array.from(leftColumn.data.slice(0, 16)))

    // Repeat the column across the entire canvas width
    for (let x = 0; x < canvas.width; x++) {
      ctx.putImageData(leftColumn, x, 0)
    }
    
    console.log('Drew stripe across canvas width:', canvas.width)
  }, [isDark, imagesLoaded])

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  )
}


