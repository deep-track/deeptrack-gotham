import { AlertTriangle, Eye, Zap, Layers, Lightbulb, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Anomaly {
  type: string
  description: string
  severity: "low" | "medium" | "high"
  confidence: number
  icon: React.ReactNode
}

interface AnomalyDetailsProps {
  anomalies: Anomaly[]
}

const mockAnomalies: Anomaly[] = [
  {
    type: "Facial Inconsistencies",
    description: "Asymmetrical features and unnatural facial proportions detected",
    severity: "high",
    confidence: 87,
    icon: <User className="h-4 w-4" />
  },
  {
    type: "Texture Artifacts",
    description: "Unnatural texture patterns and blending artifacts found",
    severity: "medium", 
    confidence: 73,
    icon: <Layers className="h-4 w-4" />
  },
  {
    type: "Lighting Inconsistencies",
    description: "Conflicting light sources and shadow patterns",
    severity: "medium",
    confidence: 68,
    icon: <Lightbulb className="h-4 w-4" />
  },
  {
    type: "Compression Anomalies",
    description: "Inconsistent compression patterns across image regions",
    severity: "low",
    confidence: 45,
    icon: <Zap className="h-4 w-4" />
  }
]

const tooltipContent = {
  "Facial Inconsistencies": "AI-generated faces often have subtle asymmetries or proportional issues that human eyes might miss.",
  "Texture Artifacts": "Synthetic images may show unnatural blending or repetitive patterns, especially at object boundaries.",
  "Lighting Inconsistencies": "Multiple light sources or impossible shadow directions can indicate image manipulation.",
  "Compression Anomalies": "Different compression levels in one image may suggest multiple source materials were combined."
}

export function AnomalyDetails({ anomalies = mockAnomalies }: AnomalyDetailsProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-destructive"
      case "medium": return "text-warning"
      case "low": return "text-muted-foreground"
      default: return "text-muted-foreground"
    }
  }

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case "high": return "bg-destructive/10 border-destructive/20"
      case "medium": return "bg-warning/10 border-warning/20"
      case "low": return "bg-muted/20 border-muted"
      default: return "bg-muted/20"
    }
  }

  return (
    <TooltipProvider>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Anomaly Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {anomalies.map((anomaly, index) => (
            <Card 
              key={index}
              className={`transition-all duration-200 hover:shadow-md ${getSeverityBg(anomaly.severity)}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-background/50 ${getSeverityColor(anomaly.severity)}`}>
                      {anomaly.icon}
                    </div>
                    <div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h4 className="font-medium hover:text-primary cursor-help transition-colors">
                            {anomaly.type}
                          </h4>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p>{tooltipContent[anomaly.type as keyof typeof tooltipContent]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${getSeverityColor(anomaly.severity)}`}>
                      {anomaly.confidence}%
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {anomaly.severity.toUpperCase()}
                    </p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {anomaly.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Detection Confidence</span>
                    <span>{anomaly.confidence}%</span>
                  </div>
                  <Progress 
                    value={anomaly.confidence} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {anomalies.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="p-4 rounded-full bg-muted/20 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 opacity-50" />
              </div>
              <p className="font-medium">No significant anomalies detected</p>
              <p className="text-xs mt-1">This image appears to be authentic</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}