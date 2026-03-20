import React from 'react'
import { COLORS } from '@/lib/tokens'

// ── FormField wrapper ─────────────────────────────────────────────────────────

interface FormFieldProps {
  label:     string
  htmlFor?:  string
  required?: boolean
  hint?:     string
  error?:    string
  children:  React.ReactNode
  className?: string
}

export function FormField({ label, htmlFor, required, hint, error, children, className = '' }: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 700,
          color: '#D4AF5C',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
        {required && <span style={{ color: COLORS.crimson, marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint  && !error && <p style={{ fontSize: 11, color: COLORS.stone }}>{hint}</p>}
      {error &&           <p style={{ fontSize: 11, color: COLORS.crimson }}>{error}</p>}
    </div>
  )
}

// ── Shared input styles ───────────────────────────────────────────────────────

const baseInput: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 14,
  borderRadius: 8,
  border: `1px solid ${COLORS.mist}`,
  background: COLORS.pearl,
  color: '#FFFFFF',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: 'var(--font-instrument), system-ui, sans-serif',
}

function focusStyle(el: HTMLElement) {
  el.style.borderColor = COLORS.sage
  el.style.boxShadow = `0 0 0 3px rgba(212,175,92,0.15)`
}
function blurStyle(el: HTMLElement) {
  el.style.borderColor = COLORS.mist
  el.style.boxShadow = 'none'
}

// ── Input ─────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefixIcon?: React.ReactNode
  error?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, prefixIcon, style, onFocus, onBlur, ...props }, ref) => (
    <div className="relative">
      {prefixIcon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: COLORS.stone }}>
          {prefixIcon}
        </span>
      )}
      <input
        ref={ref}
        style={{
          ...baseInput,
          paddingLeft: prefixIcon ? 34 : 12,
          borderColor: error ? COLORS.crimson : COLORS.mist,
          ...style,
        }}
        onFocus={e => { focusStyle(e.target); onFocus?.(e) }}
        onBlur={e  => { blurStyle(e.target);  onBlur?.(e)  }}
        {...props}
      />
    </div>
  )
)
Input.displayName = 'Input'

// ── Textarea ──────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  mono?:  boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, mono, style, onFocus, onBlur, ...props }, ref) => (
    <textarea
      ref={ref}
      style={{
        ...baseInput,
        resize: 'vertical',
        minHeight: 80,
        borderColor: error ? COLORS.crimson : COLORS.mist,
        fontFamily: mono ? 'var(--font-mono), Consolas, monospace' : baseInput.fontFamily,
        ...style,
      }}
      rows={props.rows ?? 3}
      onFocus={e => { focusStyle(e.target); onFocus?.(e) }}
      onBlur={e  => { blurStyle(e.target);  onBlur?.(e)  }}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

// ── Select ────────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options:      { value: string; label: string }[]
  placeholder?: string
  error?:       boolean
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, error, style, onFocus, onBlur, ...props }, ref) => (
    <select
      ref={ref}
      style={{
        ...baseInput,
        cursor: 'pointer',
        borderColor: error ? COLORS.crimson : COLORS.mist,
        ...style,
      }}
      onFocus={e => { focusStyle(e.target); onFocus?.(e) }}
      onBlur={e  => { blurStyle(e.target);  onBlur?.(e)  }}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
)
Select.displayName = 'Select'
