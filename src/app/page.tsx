'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card, CardHeader, CardContent, CardTitle,
} from "@/components/ui/card"
import { UploadArea } from "@/components/upload/upload-area"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useDashboardStore } from "@/lib/store"


export default function Dashboard() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const router = useRouter()

const handleProceed = async () => {
  if (selectedFiles.length === 0) return

  const readFiles = selectedFiles.map(
    file =>
      new Promise<{ imageBase64: string; fileMeta: any; result: any; timestamp: string }>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = function (e) {
          const imageBase64 = e.target?.result as string
          resolve({
            imageBase64,
            fileMeta: { name: file.name, type: file.type, size: file.size },
            result: { isAuthentic: true }, 
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
    <div className="p-4 space-y-6 max-w-3xl mx-auto">

      {/* Page Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          AI Image Verification
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Upload images to verify their authenticity using advanced AI algorithms
        </p>
      </div>

      {/* Upload Section */}
      <Card className="border border-gray-700 bg-muted/40">
        <CardHeader>
          <CardTitle className="text-white text-lg">Upload Media</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UploadArea
            onFileSelect={(files) => setSelectedFiles(files)}
            selectedFiles={selectedFiles}
            onClearFiles={() => setSelectedFiles([])}
          />
          <div className="text-xs text-muted-foreground">
            Max file size 300MB. Accepted formats: MP4, WebM.
          </div>
        </CardContent>
      </Card>

      {/* Final CTA */}
      <Button
        onClick={handleProceed}
        className={cn(
          "w-full",
          "text-white text-base font-medium py-6 rounded-xl shadow-xl"
        )}
      >
        Save and proceed to view results
      </Button>
    </div>
  )
}
