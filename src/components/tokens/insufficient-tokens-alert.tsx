"use client"

import { AlertTriangle, Coins, ArrowRight } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SimpleTokenPurchase } from "./simple-token-purchase"

interface InsufficientTokensAlertProps {
  currentTokens: number
  requiredTokens: number
  className?: string
}

export function InsufficientTokensAlert({ 
  currentTokens, 
  requiredTokens, 
  className 
}: InsufficientTokensAlertProps) {
  return (
    <div className={className}>
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
            <AlertTriangle className="h-5 w-5" />
            Insufficient Tokens
          </CardTitle>
          <CardDescription className="text-orange-700 dark:text-orange-300">
            You need more tokens to upload and verify media files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
            <Coins className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800 dark:text-orange-200">
              Token Balance
            </AlertTitle>
            <AlertDescription className="text-orange-700 dark:text-orange-300">
              You currently have <strong>{currentTokens} token{currentTokens !== 1 ? 's' : ''}</strong>, 
              but you need <strong>at least {requiredTokens} token{requiredTokens !== 1 ? 's' : ''}</strong> 
              to proceed. Each token costs 100 bob and allows you to verify one media file.
            </AlertDescription>
          </Alert>

          <SimpleTokenPurchase className="mt-4" />

          <div className="text-sm text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/40 p-3 rounded-lg">
            <strong>Note:</strong> Demo users receive 300 tokens automatically. 
            If you're a demo user, please contact support if you're seeing this message.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
