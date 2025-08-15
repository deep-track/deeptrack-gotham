'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card"
import { UploadArea } from "@/components/upload/upload-area"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useDashboardStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export default function Dashboard() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser();


  const handleProceed = async () => {
    if (selectedFiles.length === 0) return

    setIsProcessing(true)

    try {
      const results = await Promise.all(
        selectedFiles.map(async (file) => {
          const formData = new FormData()
          formData.append('media', file)

          const response = await fetch('/api/check-media', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            throw new Error(`Failed to process ${file.name}`)
          }

          return await response.json()
        })
      )

      useDashboardStore.setState({ resultData: results })
      router.push("/results")
    } catch (error) {
      console.error('Error processing files:', error)
      // You might want to show an error toast here
    } finally {
      setIsProcessing(false)
    }
  }

useEffect(() => {
  if (isLoaded && !isSignedIn) {
    router.replace("/login");
  }
}, [isLoaded, isSignedIn, router]);


  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-4 sm:px-8 py-10 max-w-5xl mx-auto space-y-10"
    >
      {/* Page Header */}
      <header className="text-center sm:text-left space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0] bg-clip-text text-transparent">
          AI Image & Audio Verification
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-lg">
          Upload images (JPG, PNG) and audio files (MP3, WAV) to verify their authenticity using advanced AI detection algorithms.
        </p>
        <hr className="border-t border-[hsl(var(--border))] opacity-20 mt-4" />
      </header>

      {/* Upload Section */}
      <div className="relative rounded-[var(--radius-lg)] p-[2px] bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0]">
        <div className="rounded-[inherit] bg-[rgb(10,10,10)] dark:bg-[rgb(10,10,10)]">
          <Card className="w-full bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] rounded-[var(--radius-lg)] shadow-[0_0_20px_hsl(var(--primary)/0.1)] transition hover:shadow-[0_0_30px_hsl(var(--primary)/0.25)]">
            <CardHeader>
              <CardTitle className="text-white text-lg sm:text-xl font-semibold">
                Upload Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <UploadArea
                onFileSelect={(files) => setSelectedFiles(files)}
                selectedFiles={selectedFiles}
                onClearFiles={() => setSelectedFiles([])}
              />
              <p className="text-xs text-muted-foreground">
                Max file size 300MB. Accepted formats: JPG, PNG, MP3, WAV, MP4, WebM.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Final CTA */}
      <div>
        <Button
          onClick={handleProceed}
          disabled={selectedFiles.length === 0 || isProcessing}
          className={cn(
            "w-full",
            "bg-gradient-to-r from-[hsl(var(--primary))]/60 to-[#7F5AF0]/70",
            "text-[hsl(var(--primary-foreground))]",
            "text-base font-medium py-5 rounded-[var(--radius)]",
            "shadow-[0_0_30px_hsl(var(--primary)/0.3)] transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Analyze Media with Deeptrack"
          )}
        </Button>
      </div>
    </motion.div>
  )
}
