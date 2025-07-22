import {
  Shield,
  Lightbulb,
  AlertTriangle,
  Brain
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export function Sidebar() {
  const tips = [
    {
      icon: <Shield className="h-5 w-5 text-primary" />,
      title: "Verify Sources",
      description: "Always check the original source and publication context."
    },
    {
      icon: <Brain className="h-5 w-5 text-success" />,
      title: "AI Pattern Detection",
      description: "Let our algorithms reveal hidden signs of manipulation."
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-destructive" />,
      title: "Question Perfection",
      description: "Images that look flawless might be synthetically generated."
    }
  ]

  return (
    <div className="w-64 lg:w-72 p-4 border-l border-border bg-muted/20">
      <Card className="shadow-sm h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-5 w-5 text-warning" />
            Media Tips
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {tips.map((tip, index) => (
            <div
              key={index}
              className="group p-4 rounded-lg bg-background border hover:shadow-sm transition hover:border-primary/30"
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">{tip.icon}</div>
                <div className="space-y-1 flex-1">
                  <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {tip.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tip.description}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <Separator className="my-4" />

          <div className="space-y-2 text-center">
            <Badge variant="outline" className="w-full justify-center py-1.5 text-xs">
              <Shield className="h-3 w-3 mr-1" />
              AI Detection Active
            </Badge>

            <div className="space-y-0.5">
              <p className="text-xs font-medium">Detection Accuracy</p>
              <p className="text-lg font-bold text-primary">96.8%</p>
              <p className="text-xs text-muted-foreground">
                Based on live validation data
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
