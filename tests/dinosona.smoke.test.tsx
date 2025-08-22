import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

// @vitest-environment happy-dom

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
  it('shows redirect to photobooth', async () => {
    render(<DinosonaPage />)

    // Should show the redirect page
    expect(screen.getByText('Dinosona Photobooth')).toBeInTheDocument()
    expect(screen.getByText(/moved dinosona into the new multi-step photobooth/)).toBeInTheDocument()
    
    // Should have a link to the photobooth with dinosona generator
    const photoboothLink = screen.getByRole('link')
    expect(photoboothLink).toHaveAttribute('href', '/photobooth?generator=dinosona')
    expect(screen.getByText('Open Photobooth')).toBeInTheDocument()
  })
})
