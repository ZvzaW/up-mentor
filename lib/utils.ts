import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { WorkplaceAddress } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export const toDateInputValue = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function toTimeInputValue(d: Date) {
  const hours = String(d.getHours()).padStart(2, "0")
  const minutes = String(d.getMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

export function combineDateAndTime(date: string, time: string) {
  const [y, mo, d] = date.split("-").map(Number)
  const [h, m] = time.split(":").map(Number)
  return new Date(y, mo - 1, d, h, m, 0, 0)
}

export function calculateAge(birthdate: Date) {
  const birth = new Date(birthdate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function formatWorkplaceAddress(workplace: WorkplaceAddress) {
  return `${workplace.name} - ul. ${workplace.street} ${workplace.building_number}${workplace.flat_number ? `/${workplace.flat_number}` : ""}, ${workplace.city}`
}
