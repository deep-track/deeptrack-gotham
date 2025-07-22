import { CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface VerificationBadgeProps {
  isAuthentic: boolean
  className?: string
}

export function VerificationBadge({ isAuthentic, className }: VerificationBadgeProps) {
  return (
    <Badge 
      variant={isAuthentic ? "default" : "destructive"}
      className={cn(
        "text-sm font-semibold px-3 py-1 flex items-center gap-2",
        isAuthentic ? "authentic-badge shadow-glow" : "synthetic-badge shadow-glow",
        className
      )}
    >
      {isAuthentic ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      {isAuthentic ? "Authentic" : "Synthetic"}
    </Badge>
  )
}