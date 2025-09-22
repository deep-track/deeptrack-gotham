"use client"

import { useState } from "react"
import { Coins, Loader2, CreditCard, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@clerk/nextjs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface TokenPurchaseProps {
  trigger?: React.ReactNode
  onPurchaseComplete?: () => void
}

const TOKEN_PACKAGES = [
  { tokens: 1, price: 100, label: "1 Token", description: "100 bob ($1.00)" },
  { tokens: 2, price: 200, label: "2 Tokens", description: "200 bob ($2.00)" },
  { tokens: 3, price: 300, label: "3 Tokens", description: "300 bob ($3.00)" },
  { tokens: 4, price: 400, label: "4 Tokens", description: "400 bob ($4.00)" },
  { tokens: 5, price: 500, label: "5 Tokens", description: "500 bob ($5.00)" },
  { tokens: 6, price: 600, label: "6 Tokens", description: "600 bob ($6.00)" },
  { tokens: 7, price: 700, label: "7 Tokens", description: "700 bob ($7.00)" },
  { tokens: 8, price: 800, label: "8 Tokens", description: "800 bob ($8.00)" },
  { tokens: 9, price: 900, label: "9 Tokens", description: "900 bob ($9.00)" },
  { tokens: 10, price: 1000, label: "10 Tokens", description: "1000 bob ($10.00)" },
]

export function TokenPurchase({ trigger, onPurchaseComplete }: TokenPurchaseProps) {
  const [selectedTokens, setSelectedTokens] = useState("1")
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const { isSignedIn } = useUser()

  const selectedPackage = TOKEN_PACKAGES.find(pkg => pkg.tokens.toString() === selectedTokens) || TOKEN_PACKAGES[0]

  const handlePurchase = async () => {
    if (!isSignedIn) {
      toast({
        title: "Sign in required",
        description: "Please sign in to purchase tokens",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch("/api/purchase-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokens: selectedPackage.tokens,
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

  const defaultTrigger = (
    <Button className="bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0] hover:opacity-90">
      <Coins className="h-4 w-4 mr-2" />
      Buy Tokens
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            Purchase Tokens
          </DialogTitle>
          <DialogDescription>
            Each token costs 100 bob ($1.00) and allows you to verify one media file. Select the number of tokens you need (max 10).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Token Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Tokens</label>
              <Select value={selectedTokens} onValueChange={setSelectedTokens}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select number of tokens" />
                </SelectTrigger>
                <SelectContent>
                  {TOKEN_PACKAGES.map((pkg) => (
                    <SelectItem key={pkg.tokens} value={pkg.tokens.toString()}>
                      {pkg.label} - {pkg.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pricing Info */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Selected:</span>
                <span className="text-sm font-medium">{selectedPackage.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Price:</span>
                <span className="text-lg font-bold">{selectedPackage.price.toLocaleString()} bob (${(selectedPackage.price / 100).toFixed(2)})</span>
              </div>
            </div>
          </div>


          {/* Payment Info */}
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <div className="font-medium mb-1">Secure Payment</div>
              <div className="text-muted-foreground">
                You'll be redirected to Paystack for secure payment processing. 
                Your tokens will be added automatically after successful payment.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={isProcessing || !isSignedIn}
              className="flex-1 bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0] hover:opacity-90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay {selectedPackage.price.toLocaleString()} bob (${(selectedPackage.price / 100).toFixed(2)})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
