"use client"

import { EmailSignupModal } from "@/components/email-signup-modal"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function EmailSignupTestPage() {
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = async (email: string, preferences: any) => {
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
      
    } catch (error) {
      console.error('Email signup error:', error)
      throw error
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Email Signup Test</h1>
        <p className="text-muted-foreground">
          Test the email signup modal functionality
        </p>
        <Button onClick={() => setIsOpen(true)}>
          Open Email Signup
        </Button>
      </div>

      <EmailSignupModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
