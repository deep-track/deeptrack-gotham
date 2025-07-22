import { Shield, Menu, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { NavLink } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  onMenuToggle?: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 theme-transition">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 animate-fade-in">
              <DropdownMenuItem asChild>
                <NavLink
                  to="/"
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium"
                >
                  <Shield className="h-4 w-4" />
                  Dashboard
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <NavLink
                  to="/history"
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium"
                >
                  <History className="h-4 w-4" />
                  History
                </NavLink>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg gradient-primary shadow-glow">
              <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base sm:text-xl font-bold gradient-primary bg-clip-text text-transparent">
                <span className="hidden sm:inline">Deeptrack Gotham</span>
                <span className="sm:hidden">Deeptrack</span>
              </h1>
              <span className="text-xs text-muted-foreground hidden sm:inline">AI Image Verification</span>
            </div>
          </div>
        </div>


        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="hidden lg:flex items-center gap-2 sm:gap-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`
              }
            >
              <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`
              }
            >
              <History className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">History</span>
            </NavLink>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}