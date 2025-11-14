'use client'

import { useEffect } from 'react'

export function DynamicMeta({ settings }: { settings: any }) {
  useEffect(() => {
    if (!settings) return

    // Update document title
    if (settings.siteTitle) {
      document.title = settings.siteTitle
    }

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, attribute: string = 'name') => {
      if (!content) return
      let element = document.querySelector(`meta[${attribute}="${name}"]`)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, name)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    // Update description
    updateMetaTag('description', settings.siteDescription || '')

    // Update keywords
    updateMetaTag('keywords', settings.siteKeywords || '')

    // Update Open Graph tags
    updateMetaTag('og:title', settings.siteTitle || '', 'property')
    updateMetaTag('og:description', settings.siteDescription || '', 'property')
    if (settings.ogImageUrl) {
      updateMetaTag('og:image', settings.ogImageUrl, 'property')
    }

    // Update favicon
    if (settings.faviconUrl) {
      let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement
      if (!favicon) {
        favicon = document.createElement('link')
        favicon.rel = 'icon'
        document.head.appendChild(favicon)
      }
      favicon.href = settings.faviconUrl
    }
  }, [settings])

  return null
}

