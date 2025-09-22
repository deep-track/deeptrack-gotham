"use client"

import { useState, useEffect } from "react"
import { Coins, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@clerk/nextjs"

interface TokenDisplayProps {
  className?: string
  showPurchaseButton?: boolean
  onPurchaseClick?: () => void
}

interface TokenData {
  tokens: number
  email: string
  isDemoUser: boolean
}

export function TokenDisplay({ className, showPurchaseButton = false, onPurchaseClick }: TokenDisplayProps) {
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()
  const { isSignedIn } = useUser()

  const fetchTokenData = async (showRefreshing = false) => {
    if (!isSignedIn) {
      setLoading(false)
      return
    }

    if (showRefreshing) {
      setRefreshing(true)
    }

    try {
      const response = await fetch("/api/purchase-tokens")
      if (!response.ok) {
        throw new Error("Failed to fetch token data")
      }

      const data = await response.json()
      setTokenData(data)
    } catch (error) {
      console.error("Error fetching token data:", error)
      toast({
        title: "Error",
        description: "Failed to load token balance",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTokenData()
  }, [isSignedIn])

  const handleRefresh = () => {
    fetchTokenData(true)
  }

  if (!isSignedIn) {
    return null
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    )
  }

  if (!tokenData) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="text-muted-foreground hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">Failed to load</span>
      </div>
    )
  }

  const getTokenBadgeVariant = (tokens: number) => {
    if (tokens === 0) return "destructive"
    if (tokens < 5) return "secondary"
    return "default"
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Coins className="h-4 w-4 text-yellow-500" />
        <Badge 
          variant={getTokenBadgeVariant(tokenData.tokens)}
          className="text-xs font-medium"
        >
          {tokenData.tokens} {tokenData.tokens === 1 ? 'token' : 'tokens'}
        </Badge>
        {tokenData.isDemoUser && (
          <Badge variant="outline" className="text-xs">
            Demo
          </Badge>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        disabled={refreshing}
        className="h-6 w-6 p-0 text-muted-foreground hover:text-white"
      >
        <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
      </Button>

      {showPurchaseButton && !tokenData.isDemoUser && (
        <Button
          size="sm"
          onClick={onPurchaseClick}
          className="h-7 px-3 text-xs bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0] hover:opacity-90"
        >
          Buy Tokens
        </Button>
      )}
    </div>
  )
}
