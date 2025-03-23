import React from "react"

interface ErrorMessageProps {
  message: string
  className?: string
}

export function ErrorMessage({ message, className = "" }: ErrorMessageProps) {
  if (!message) return null
  
  return (
    <div className={`text-red-500 text-sm py-2 ${className}`}>
      {message}
    </div>
  )
} 