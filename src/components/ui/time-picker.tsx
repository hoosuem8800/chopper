import * as React from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

interface TimePickerInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function TimePickerInput({ value, onChange, className }: TimePickerInputProps) {
  return (
    <div className="relative">
      <Input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("w-full", className)}
      />
    </div>
  )
} 