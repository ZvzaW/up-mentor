"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, ChevronDown, User, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/actions/authorization"
import { toast } from "sonner"

interface NavbarProps {
  role: "trainer" | "trainee" | string
}

export default function Navbar({ role }: NavbarProps) {
  const pathname = usePathname() || ""
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isResourcesOpen, setIsResourcesOpen] = useState(false)

  const handleLogout = async () => {
    const result = await logout()
    if (result?.error) {
      toast.error(result.error)
    }
  }

  const roleSpecificLink =
    role === "trainer"
      ? { name: "Podopieczni", href: "/dashboard/trainees" }
      : { name: "Trenerzy", href: "/dashboard/trainers" }

  const navLinks = [
    { name: "Czat", href: "/dashboard/chat" },
    { name: "Treningi", href: "/dashboard/trainings" },
    roleSpecificLink,
  ]

  //Dropdown menu - ZASOBY
  const resourceLinks = [
    { name: "Ćwiczenia", href: "/dashboard/exercises" },
    { name: "Plany treningowe", href: "/dashboard/workout-plans" },
  ]

  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <nav className="border-baby-blue font-michroma sticky top-0 z-50 w-full border-b bg-[#1a1e2a]/40 backdrop-blur-xl">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/*LOGO*/}
          <Link href="/dashboard" className="group flex items-center">
            <div
              className="group-hover:border-baby-blue relative flex h-12 w-32 items-center justify-center border transition-colors"
              title="Strona główna"
            >
              <span>LOGO</span>
            </div>
          </Link>

          {/*DESKTOP MENU*/}
          <div className="hidden items-center space-x-10 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`hover:text-baby-blue transition-colors ${
                  isActive(link.href) ? "text-baby-blue" : "text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* DROPDOWN: ZASOBY */}
            <DropdownMenu
              open={isResourcesOpen}
              onOpenChange={setIsResourcesOpen}
              modal={false}
            >
              <DropdownMenuTrigger
                asChild
                onMouseEnter={() => setIsResourcesOpen(true)}
                onMouseLeave={() => setIsResourcesOpen(false)}
              >
                <button
                  suppressHydrationWarning 
                  className={`hover:text-baby-blue flex items-center py-7 transition-colors ${
                    isActive("/dashboard/exercises") ||
                    isActive("/dashboard/workout-plans")
                      ? "text-baby-blue"
                      : "text-white"
                  }`}
                >
                  Zasoby <ChevronDown size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                onMouseEnter={() => setIsResourcesOpen(true)}
                onMouseLeave={() => setIsResourcesOpen(false)}
                sideOffset={0}
                className="border-baby-blue bg-dark-navy w-52"
              >
                {resourceLinks.map((link) => (
                  <DropdownMenuItem
                    key={link.name}
                    onClick={() => setIsResourcesOpen(false)}
                    className={`m-2 ${isActive(link.href) ? "text-baby-blue bg-dirty-navy" : "hover:bg-dirty-navy"} `}
                  >
                    <Link
                      href={link.href}
                      className="font-michroma block w-full p-1"
                    >
                      {link.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/*DESKTOP: Profile, Log-out*/}
          <div className="hidden items-center space-x-4 md:flex">
            <Link
              href="/dashboard/profile"
              title="Profil"
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                isActive("/dashboard/profile")
                  ? "text-baby-blue border-baby-blue border-2"
                  : "hover:text-baby-blue hover:border-baby-blue border border-zinc-300 text-zinc-300 hover:border-2"
              }`}
            >
              <User size={20} />
            </Link>
            <button
              onClick={handleLogout}
              title="Wyloguj się"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-300 text-zinc-300 transition-all hover:border-2 hover:border-red-400 hover:text-red-400"
            >
              <LogOut size={20} />
            </button>
          </div>

          {/*----------------------------------------------------------------------------------*/}
          {/*MENU ICON (MOBILE)*/}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-baby-blue p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/*MOBILE MENU*/}
      {isMobileMenuOpen && (
        <div className="bg-dark-navy border-baby-blue absolute top-20 left-0 w-full border-t px-4 pt-2 pb-6 md:hidden">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block rounded-xl px-4 py-3 text-base font-medium ${
                  isActive(link.href)
                    ? "bg-dirty-navy text-baby-blue"
                    : "hover:bg-dirty-navy text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {resourceLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block rounded-xl px-4 py-3 text-base font-medium ${
                  isActive(link.href)
                    ? "bg-dirty-navy text-baby-blue"
                    : "hover:bg-dirty-navy text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/*MOBILE: Profile, Log-out*/}
            <div className="mt-2 flex gap-4 border-t border-zinc-700 px-4 pt-4">
              <Link
                href="/dashboard/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`bg-dirty-navy flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 ${
                  isActive("/dashboard/profile")
                    ? "text-baby-blue border-baby-blue"
                    : "border-zinc-700 text-zinc-300"
                }`}
              >
                <User size={20} /> Profil
              </Link>
              <button
                onClick={handleLogout}
                className="bg-dirty-navy flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-700 py-3 text-zinc-300 hover:text-red-400"
              >
                <LogOut size={20} /> Wyloguj
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}