import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return ""
  return timeStr.slice(0, 5)
}

export function formatDateTime(isoStr: string): string {
  if (!isoStr) return ""
  try {
    const d = new Date(isoStr)
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return isoStr
  }
}
