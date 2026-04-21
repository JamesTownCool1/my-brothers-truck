'use client';
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, ...rest },
  ref
) {
  const inputId = id || rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-800">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'h-11 rounded-lg border-2 border-ink-200 bg-white px-4 text-[15px] text-ink-900 placeholder:text-ink-500 focus:border-brand-500 focus:outline-none',
          error && 'border-red-500 focus:border-red-500',
          className
        )}
        {...rest}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
      {hint && !error && <span className="text-xs text-ink-500">{hint}</span>}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, ...rest },
  ref
) {
  const inputId = id || rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-800">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          'min-h-[100px] rounded-lg border-2 border-ink-200 bg-white px-4 py-3 text-[15px] text-ink-900 placeholder:text-ink-500 focus:border-brand-500 focus:outline-none resize-y',
          error && 'border-red-500 focus:border-red-500',
          className
        )}
        {...rest}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
      {hint && !error && <span className="text-xs text-ink-500">{hint}</span>}
    </div>
  );
});

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, children, className, id, ...rest },
  ref
) {
  const inputId = id || rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-800">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={cn(
          'h-11 rounded-lg border-2 border-ink-200 bg-white px-3 text-[15px] text-ink-900 focus:border-brand-500 focus:outline-none',
          error && 'border-red-500',
          className
        )}
        {...rest}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
});
