import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock next/link for DOM environment
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={typeof href === 'string' ? href : '#'} {...props}>{children}</a>
  ),
}))

// Mock fetch for generation API
beforeAll(() => {
  global.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
    if (url === '/api/images/generate' && opts?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: async () => ({ images: [{ url: '/generated/dino.png' }] }),
      })
    }
    if (url === '/api/images/upload' && opts?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: async () => ({ baseImageId: 'base-123', url: '/uploads/base/base-123.png' }),
      })
    }
    return Promise.resolve({ ok: false, json: async () => ({}) })
  }) as any
})

import DinosonaPage from '../app/dinosona/page'

describe('Dinosona generator smoke test', () => {
  it('composes a prompt, uploads a base photo, and generates an image', async () => {
    render(<DinosonaPage />)

    // Ensure form is present
    const form = await screen.findByRole('form', { name: /dinosona-form/i })
    expect(form).toBeInTheDocument()

    // Click sample photo to set base image
    fireEvent.click(screen.getByTestId('use-sample-photo'))

    // Wait for the UI to reflect that the photo is ready and Generate is enabled
    await waitFor(() => expect(screen.getByText(/photo ready/i)).toBeInTheDocument())
    const generateBtn = await screen.findByRole('button', { name: /generate/i })
    await waitFor(() => expect(generateBtn).toBeEnabled())

    // Type a custom species to ensure prompt updates
    const species = screen.getByLabelText(/species/i) as HTMLInputElement
    fireEvent.change(species, { target: { value: 'stegosaurus' } })

    // Submit the form
    fireEvent.click(generateBtn)

    // Should show the generated image
    await waitFor(() => expect(screen.getByAltText(/Generated dinosona/i)).toBeInTheDocument())
  })
})
