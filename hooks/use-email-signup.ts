"use client"

import { useState } from "react"

interface EmailPreferences {
  productUpdates: boolean
  newFeatures: boolean
  tips: boolean
  promotions: boolean
}

interface UseEmailSignupReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  // Returns true on success; throws on error. `source` must be non-null.
  submit: (email: string, preferences: EmailPreferences, source: string) => Promise<boolean>
  isSubmitting: boolean
  hasShownForSession: boolean
}

export function useEmailSignup(): UseEmailSignupReturn {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasShownForSession, setHasShownForSession] = useState(false)

  const open = () => {
    setIsOpen(true)
    setHasShownForSession(true)
  }

  const close = () => {
    setIsOpen(false)
  }

  const submit = async (
    email: string,
    preferences: EmailPreferences,
    source: string,
  ): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/email-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          preferences,
          source,
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as any))
        throw new Error(errorData.error || 'Failed to sign up')
      }

      // On success, mark the session so we don't re-show, and close the modal
      sessionStorage.setItem('email_signup_completed', 'true')
      close()
      return true
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    isOpen,
    open,
    close,
    submit,
    isSubmitting,
    hasShownForSession
  }
}
