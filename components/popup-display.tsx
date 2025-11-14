'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, CheckCircle, AlertCircle, Info, Gift } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface Popup {
  id: string
  title: string
  content: string
  type: string
  position: string
  buttonText: string | null
  buttonLink: string | null
  imageUrl: string | null
  showOnce: boolean
}

export function PopupDisplay() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [popups, setPopups] = useState<Popup[]>([])
  const [currentPopup, setCurrentPopup] = useState<Popup | null>(null)
  const [dismissedPopups, setDismissedPopups] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user) {
      fetchPopups()
    }
  }, [user, pathname])

  useEffect(() => {
    // Check for dismissed popups in localStorage
    const dismissed = localStorage.getItem('dismissedPopups')
    if (dismissed) {
      setDismissedPopups(new Set(JSON.parse(dismissed)))
    }
  }, [])

  useEffect(() => {
    // Show first popup that hasn't been dismissed
    if (popups.length > 0) {
      const availablePopup = popups.find(
        (popup) => !dismissedPopups.has(popup.id) && (!popup.showOnce || !localStorage.getItem(`popup_${popup.id}_shown`))
      )
      if (availablePopup) {
        setCurrentPopup(availablePopup)
        trackView(availablePopup.id)
        if (availablePopup.showOnce) {
          localStorage.setItem(`popup_${availablePopup.id}_shown`, 'true')
        }
      }
    }
  }, [popups, dismissedPopups])

  const fetchPopups = async () => {
    try {
      const role = user?.role || 'customer'
      const response = await fetch(`/api/popups?activeOnly=true&role=${role}&page=${pathname}`)
      const data = await response.json()
      setPopups(data.popups || [])
    } catch (error) {
      console.error('Error fetching popups:', error)
    }
  }

  const trackView = async (popupId: string) => {
    try {
      await fetch(`/api/popups/${popupId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view' }),
      })
    } catch (error) {
      console.error('Error tracking popup view:', error)
    }
  }

  const handleDismiss = async () => {
    if (currentPopup) {
      const newDismissed = new Set(dismissedPopups)
      newDismissed.add(currentPopup.id)
      setDismissedPopups(newDismissed)
      localStorage.setItem('dismissedPopups', JSON.stringify(Array.from(newDismissed)))

      // Track dismissal
      try {
        await fetch(`/api/popups/${currentPopup.id}/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'dismiss' }),
        })
      } catch (error) {
        console.error('Error tracking popup dismissal:', error)
      }

      setCurrentPopup(null)
    }
  }

  const handleButtonClick = () => {
    if (currentPopup?.buttonLink) {
      window.location.href = currentPopup.buttonLink
    }
    handleDismiss()
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-600" />
      case 'promotion':
        return <Gift className="w-6 h-6 text-purple-600" />
      default:
        return <Info className="w-6 h-6 text-blue-600" />
    }
  }

  if (!currentPopup) return null

  return (
    <Dialog open={!!currentPopup} onOpenChange={() => handleDismiss()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {getTypeIcon(currentPopup.type)}
            <DialogTitle>{currentPopup.title}</DialogTitle>
          </div>
          <DialogDescription>
            <div
              className="text-foreground"
              dangerouslySetInnerHTML={{ __html: currentPopup.content }}
            />
          </DialogDescription>
        </DialogHeader>

        {currentPopup.imageUrl && (
          <div className="my-4">
            <img
              src={currentPopup.imageUrl}
              alt={currentPopup.title}
              className="w-full h-auto rounded-lg"
            />
          </div>
        )}

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={handleDismiss}>
            Close
          </Button>
          {currentPopup.buttonText && (
            <Button onClick={handleButtonClick} className="bg-gradient-to-r from-blue-500 to-cyan-500">
              {currentPopup.buttonText}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

