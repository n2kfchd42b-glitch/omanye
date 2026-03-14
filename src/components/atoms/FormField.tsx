import React from 'react'
import { cn } from '@/lib/utils'

// ── FormField wrapper ─────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
  className?: string
}

export function FormField({ label, htmlFor, required, hint, error, children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-forest/90"
      >
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint  && !error && <p className="text-xs text-fern/50">{hint}</p>}
      {error &&           <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  prefixIcon?: React.ReactNode
  suffixIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, prefixIcon, suffixIcon, ...props }, ref) => (
    <div className="relative">
      {prefixIcon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fern/40 pointer-events-none">
          {prefixIcon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full px-3 py-2 text-sm rounded-lg border bg-white text-forest',
          'placeholder:text-forest/35 transition-all outline-none',
          'focus:ring-2 focus:ring-moss/25 focus:border-moss',
          error
            ? 'border-red-400 focus:ring-red-200 focus:border-red-400'
            : 'border-mist hover:border-mint',
          prefixIcon && 'pl-9',
          suffixIcon && 'pr-9',
          className
        )}
        {...props}
      />
      {suffixIcon && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-fern/40 pointer-events-none">
          {suffixIcon}
        </span>
      )}
    </div>
  )
)
Input.displayName = 'Input'

// ── Textarea ──────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full px-3 py-2 text-sm rounded-lg border bg-white text-forest resize-none',
        'placeholder:text-forest/35 transition-all outline-none',
        'focus:ring-2 focus:ring-moss/25 focus:border-moss',
        error
          ? 'border-red-400 focus:ring-red-200'
          : 'border-mist hover:border-mint',
        className
      )}
      rows={props.rows ?? 3}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

// ── Select ────────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, placeholder, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full px-3 py-2 text-sm rounded-lg border bg-white text-forest appearance-none cursor-pointer',
        'transition-all outline-none focus:ring-2 focus:ring-moss/25 focus:border-moss',
        error
          ? 'border-red-400 focus:ring-red-200'
          : 'border-mist hover:border-mint',
        className
      )}
      {...props}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
)
Select.displayName = 'Select'
