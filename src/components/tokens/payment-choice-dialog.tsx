"use client"

import { useState } from "react"
import { Coins, CreditCard, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface PaymentChoiceDialogProps {
  isOpen: boolean
  onClose: () => void
  onPayWithTokens: () => void
  onPayWithCard: () => void
  fileCount: number
  userTokens: number
  isDemoUser: boolean
}

export function PaymentChoiceDialog({
  isOpen,
  onClose,
  onPayWithTokens,
  onPayWithCard,
  fileCount,
  userTokens,
  isDemoUser
}: PaymentChoiceDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handlePayWithTokens = async () => {
    if (userTokens < fileCount) {
      toast({
        title: "Insufficient tokens",
        description: `You need ${fileCount} tokens but only have ${userTokens}. Please purchase more tokens.`,
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    try {
      await onPayWithTokens()
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePayWithCard = async () => {
    setIsProcessing(true)
    try {
      await onPayWithCard()
    } finally {
      setIsProcessing(false)
    }
  }

  const totalCost = fileCount * 100 // 100 bob per file

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            Choose Payment Method
          </DialogTitle>
          <DialogDescription>
            You have {fileCount} file{fileCount !== 1 ? 's' : ''} ready for verification. 
            Each file costs 1 token (100 bob). Choose how you'd like to pay.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Files to verify:</span>
                  <span className="text-sm font-medium">{fileCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Your tokens:</span>
                  <span className="text-sm font-medium">{userTokens}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Total cost:</span>
                  <span className="text-sm font-medium">{fileCount} token{fileCount !== 1 ? 's' : ''} ({totalCost} bob)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Options */}
          <div className="space-y-3">
            {/* Pay with Tokens */}
            <Card 
              className={`cursor-pointer transition-all ${
                userTokens >= fileCount ? "hover:bg-muted/50" : "opacity-50 cursor-not-allowed"
              }`}
              onClick={userTokens >= fileCount ? handlePayWithTokens : undefined}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  Pay with Tokens
                  {userTokens >= fileCount && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Available</span>
                  )}
                </CardTitle>
                <CardDescription>
                  Use your existing tokens ({userTokens} available)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm">
                  {userTokens >= fileCount ? (
                    <span className="text-green-600">✓ You have enough tokens</span>
                  ) : (
                    <span className="text-red-600">✗ Need {fileCount - userTokens} more tokens</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pay with Card */}
            <Card className="cursor-pointer transition-all hover:bg-muted/50" onClick={handlePayWithCard}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  Pay with Card
                </CardTitle>
                <CardDescription>
                  Pay {totalCost} bob via Paystack
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-muted-foreground">
                  Secure payment processing
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayWithTokens}
              disabled={isProcessing || userTokens < fileCount}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:opacity-90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4 mr-2" />
                  Use Tokens
                </>
              )}
            </Button>
            <Button
              onClick={handlePayWithCard}
              disabled={isProcessing}
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
                  Pay {totalCost} bob
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
