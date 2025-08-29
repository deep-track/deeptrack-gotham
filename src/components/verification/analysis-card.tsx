import { Shield, CheckCircle, XCircle, HelpCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AnalysisCardProps {
  name: string
  description: string
  status: "authentic" | "manipulated" | "not-applicable" | "analyzing"
  confidence?: number
}

export function AnalysisCard({ name, description, status, confidence }: AnalysisCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "authentic":
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
      case "manipulated":
        return <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
      case "not-applicable":
        return <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
      case "analyzing":
        return <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-primary animate-pulse" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "authentic":
        return "Authentic"
      case "manipulated":
        return `${confidence}% fake`
      case "not-applicable":
        return "Not Applicable"
      case "analyzing":
        return "ANALYZING..."
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "authentic":
        return "text-success"
      case "manipulated":
        return "text-destructive"
      case "not-applicable":
        return "text-muted-foreground"
      case "analyzing":
        return "text-primary"
    }
  }

  const getBorderColor = () => {
    switch (status) {
      case "authentic":
        return "border-l-success"
      case "manipulated":
        return "border-l-destructive"
      case "not-applicable":
        return "border-l-muted-foreground"
      case "analyzing":
        return "border-l-primary"
    }
  }

  return (
    <Card className={cn("border-l-4", getBorderColor())}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-muted/50 flex-shrink-0">
            <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2 gap-2">
              <h4 className="font-semibold text-xs sm:text-sm leading-tight">{name}</h4>
              <div className="flex items-center gap-1 flex-shrink-0">
                {getStatusIcon()}
                <span className={cn("text-xs font-medium", getStatusColor())}>
                  <span className="hidden sm:inline">{getStatusText()}</span>
                  <span className="sm:hidden">
                    {status === "authentic" ? "Authentic" : 
                     status === "manipulated" ? "Synthetic" : 
                     status === "analyzing" ? "..." : "Not applicable"}
                  </span>
                </span>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
            
            {status === "analyzing" && (
              <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse rounded-full w-2/3" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}