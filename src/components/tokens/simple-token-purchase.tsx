"use client"

import { useState } from "react"
import { Coins, Loader2, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@clerk/nextjs"

const TOKEN_OPTIONS = [
  { value: "1", label: "1 Token - 100 bob ($1.00)" },
  { value: "2", label: "2 Tokens - 200 bob ($2.00)" },
  { value: "3", label: "3 Tokens - 300 bob ($3.00)" },
  { value: "4", label: "4 Tokens - 400 bob ($4.00)" },
  { value: "5", label: "5 Tokens - 500 bob ($5.00)" },
  { value: "6", label: "6 Tokens - 600 bob ($6.00)" },
  { value: "7", label: "7 Tokens - 700 bob ($7.00)" },
  { value: "8", label: "8 Tokens - 800 bob ($8.00)" },
  { value: "9", label: "9 Tokens - 900 bob ($9.00)" },
  { value: "10", label: "10 Tokens - 1000 bob ($10.00)" },
]

interface SimpleTokenPurchaseProps {
  className?: string
  onPurchaseComplete?: () => void
}

export function SimpleTokenPurchase({ className, onPurchaseComplete }: SimpleTokenPurchaseProps) {
  const [selectedTokens, setSelectedTokens] = useState("1")
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const { isSignedIn } = useUser()

  const handlePurchase = async () => {
    if (!isSignedIn) {
      toast({
        title: "Sign in required",
        description: "Please sign in to purchase tokens",
        variant: "destructive"
      })
      return
    }

    const tokens = parseInt(selectedTokens)
    const price = tokens * 100

    setIsProcessing(true)

    try {
      const response = await fetch("/api/purchase-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokens: tokens,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize payment")
      }

      // Redirect to Paystack payment page
      if (data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        throw new Error("No payment URL received")
      }
    } catch (error) {
      console.error("Purchase error:", error)
      toast({
        title: "Purchase failed",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const selectedOption = TOKEN_OPTIONS.find(opt => opt.value === selectedTokens)
  const price = parseInt(selectedTokens) * 100

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Coins className="h-5 w-5 text-yellow-500" />
        <span className="font-medium">Buy Tokens</span>
      </div>
      
      <div className="text-sm text-muted-foreground">
        1 token = 100 bob ($1.00) • Max 10 tokens
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedTokens} onValueChange={setSelectedTokens}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select tokens" />
          </SelectTrigger>
          <SelectContent>
            {TOKEN_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handlePurchase}
          disabled={isProcessing || !isSignedIn}
          className="bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0] hover:opacity-90"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay {price} bob
            </>
          )}
        </Button>
      </div>

      {selectedOption && (
        <div className="text-sm text-center text-muted-foreground">
          {selectedOption.label}
        </div>
      )}
    </div>
  )
}
