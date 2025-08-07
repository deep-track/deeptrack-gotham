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

export default function Dashboard() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const router = useRouter()

  type FileMeta = {
    name: string
    type: string
    size: number
  }

  type Result = {
    confidence: number
    isAuthentic: boolean
    processingTime: number
  }

  const handleProceed = async () => {
    if (selectedFiles.length === 0) return

    const readFiles = selectedFiles.map(
      file =>
        new Promise<{
          imageBase64: string
          fileMeta: FileMeta
          result: Result
          timestamp: string
        }>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = function (e) {
            const imageBase64 = e.target?.result as string
            resolve({
              imageBase64,
              fileMeta: { name: file.name, type: file.type, size: file.size },
              result: {
                isAuthentic: true,
                confidence: 0.95,
                processingTime: Math.floor(Math.random() * 2000) + 1000,
              },
              timestamp: new Date().toISOString(),
            })
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
    )

    const results = await Promise.all(readFiles)
    useDashboardStore.setState({ resultData: results })
    router.push("/results")
  }

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
          AI Image Verification
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-lg">
          Upload images to verify their authenticity using advanced AI algorithms.
        </p>
        <hr className="border-t border-[hsl(var(--border))] opacity-20 mt-4" />
      </header>

      {/* Upload Section */}
      <div className="relative rounded-[var(--radius-lg)] p-[2px] bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0]">
        <div className="rounded-[inherit] bg-[rgb(10,10,10)] dark:bg-[rgb(10,10,10)]"> {/* Opaque middle layer */}
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
                Max file size 300MB. Accepted formats: MP4, WebM.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Final CTA */}
      <div>
        <Button
          onClick={handleProceed}
          className={cn(
            "w-full",
            "bg-gradient-to-r from-[hsl(var(--primary))]/60 to-[#7F5AF0]/70 ",
            "text-[hsl(var(--primary-foreground))]",
            "text-base font-medium py-5 rounded-[var(--radius)]",
            "shadow-[0_0_30px_hsl(var(--primary)/0.3)] transition-all"
          )}
        >
          Save and proceed to view results
        </Button>
      </div>
    </motion.div>
  )
}
