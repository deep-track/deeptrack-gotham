import { useEffect, useState } from "react"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfidenceScoreProps {
  score: number
  isAuthentic: boolean
  animated?: boolean
}

export function ConfidenceScore({ score, isAuthentic, animated = true }: ConfidenceScoreProps) {
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayScore(score)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setDisplayScore(score)
    }
  }, [score, animated])

  const getScoreColor = () => {
    if (isAuthentic) {
      return score >= 80 ? "text-success" : "text-warning"
    } else {
      return "text-destructive"
    }
  }


  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (displayScore / 100) * circumference

  const getConfidenceText = () => {
    if (isAuthentic) {
      return score >= 80 ? "Highly Confident" : score >= 60 ? "Moderately Confident" : "Low Certainty"
    } else {
      return score >= 80 ? "Highly Confident" : "Moderately Confident"
    }
  }

  const getProgressColor = () => {
    if (isAuthentic) {
      return score >= 80 ? "#22C55E" : "#F59E0B"
    } else {
      return "#EF4444"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <h3 className="text-lg font-semibold">Authenticity Score</h3>
        
        <div className="relative w-48 h-48">
          <svg
            className="transform -rotate-90 w-full h-full"
            viewBox="0 0 200 200"
          >
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              fill="transparent"
              className="opacity-20"
            />
            
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke={getProgressColor()}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out circle-progress"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: animated ? strokeDashoffset : circumference,
              }}
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={cn("p-3 rounded-full mb-2", isAuthentic ? "bg-success/10" : "bg-destructive/10")}>
              {isAuthentic ? (
                <Check className={cn("h-8 w-8", getScoreColor())} />
              ) : (
                <X className={cn("h-8 w-8", getScoreColor())} />
              )}
            </div>
            <span className={cn("text-3xl font-bold", getScoreColor())}>
              {Math.round(displayScore)}%
            </span>
            <span className="text-sm text-muted-foreground text-center">
              {getConfidenceText()}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg confidence-bg text-center">
        <p className="text-sm text-muted-foreground">
          {isAuthentic 
            ? score >= 80 
              ? "This image shows strong indicators of authenticity"
              : "This image shows moderate indicators of authenticity"
            : "This image shows strong indicators of synthetic generation"
          }
        </p>
      </div>
    </div>
  )
}