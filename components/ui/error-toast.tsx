"use client"

import React, { useState } from "react"
import { X } from "lucide-react"

interface ErrorToastProps {
  message: string
  onClose?: () => void
}

export function ErrorToast({ message, onClose }: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = () => {
    setIsVisible(false)
    if (onClose) {
      onClose()
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative shadow-md">
        <span className="block sm:inline">{message}</span>
        <button
          onClick={handleClose}
          className="absolute top-0 bottom-0 right-0 px-4 py-3"
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
} 