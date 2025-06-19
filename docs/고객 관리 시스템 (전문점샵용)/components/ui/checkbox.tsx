"use client";

import * as React from "react";

import { cn } from "./utils";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void;
}

function Checkbox({
  className,
  checked,
  onCheckedChange,
  onChange,
  ...props
}: CheckboxProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    onCheckedChange?.(isChecked);
    onChange?.(event);
  };

  return (
    <div className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className="sr-only peer"
        {...props}
      />
      <div
        className={cn(
          "peer border bg-white peer-checked:bg-black peer-checked:text-white peer-checked:border-black peer-focus-visible:border-blue-500 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2 size-4 shrink-0 rounded border-gray-300 transition-all outline-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 flex items-center justify-center cursor-pointer",
          className,
        )}
      >
        {checked && (
          <svg
            className="size-3 text-current"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
          </svg>
        )}
      </div>
    </div>
  );
}

export { Checkbox };