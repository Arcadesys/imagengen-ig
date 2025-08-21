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
  submit: (email: string, preferences: EmailPreferences) => Promise<void>
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

  const submit = async (email: string, preferences: EmailPreferences) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/email-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          preferences
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to sign up')
      }

      const data = await response.json()
      console.log('Email signup successful:', data)
      
      // Store that they've signed up in session storage to avoid showing again
      sessionStorage.setItem('email_signup_completed', 'true')
      
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
