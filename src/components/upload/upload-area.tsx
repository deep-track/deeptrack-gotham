import { useCallback, useState } from "react"
import { Upload, FileImage, FileAudio, X, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface UploadAreaProps {
  onFileSelect: (files: File[]) => void
  selectedFiles?: File[]
  onClearFiles?: () => void
}

export function UploadArea({ onFileSelect, selectedFiles = [], onClearFiles }: UploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [mediaUrl, setMediaUrl] = useState("")
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const { toast } = useToast()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(file => 
      file.type.startsWith("image/") || file.type.startsWith("audio/")
    )
    const rejectedFiles = files.length - validFiles.length

    if (validFiles.length > 0) {
      onFileSelect(validFiles)
    }

    if (rejectedFiles > 0) {
      toast({
        title: "Some files rejected",
        description: `${rejectedFiles} file${rejectedFiles > 1 ? "s" : ""} rejected. Only image and audio files are supported.`,
        variant: "destructive"
      })
    }
  }, [onFileSelect, toast])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    const validFiles = files.filter(file => 
      file.type.startsWith("image/") || file.type.startsWith("audio/")
    )
    const rejectedFiles = files.length - validFiles.length

    if (validFiles.length > 0) {
      onFileSelect(validFiles)
    }

    if (rejectedFiles > 0) {
      toast({
        title: "Some files rejected",
        description: `${rejectedFiles} file${rejectedFiles > 1 ? "s" : ""} rejected. Only image and audio files are supported.`,
        variant: "destructive"
      })
    }

    // Reset input to allow selecting the same files again
    e.target.value = ""
  }, [onFileSelect, toast])

  const handleUrlSubmit = useCallback(async () => {
    if (!mediaUrl.trim()) return

    setIsLoadingUrl(true)
    try {
      const url = new URL(mediaUrl.trim())
      const response = await fetch(url.toString())
      const contentType = response.headers.get("content-type")

      if (!contentType || (!contentType.startsWith("image/") && !contentType.startsWith("audio/"))) {
        throw new Error("URL does not point to a valid image or audio file")
      }

      const blob = await response.blob()
      const fileName = url.pathname.split("/").pop() || 
        (contentType.startsWith("image/") ? "image-from-url" : "audio-from-url")
      const file = new File([blob], fileName, { type: blob.type })

      onFileSelect([file])
      setMediaUrl("")

      toast({
        title: "Media loaded successfully",
        description: "File from URL has been added for verification",
      })
    } catch (error) {
      console.error("Error loading media from URL:", error)
      toast({
        title: "Failed to load file",
        description: error instanceof Error ? error.message : "Please check the URL and try again",
        variant: "destructive"
      })
    } finally {
      setIsLoadingUrl(false)
    }
  }, [mediaUrl, onFileSelect, toast])

  if (selectedFiles.length > 0) {
    return (
      <Card className="relative p-6 shadow-lg" role="region" aria-labelledby="selected-media-heading">
        <div className="flex items-center justify-between mb-4">
          <h3 id="selected-media-heading" className="text-lg font-semibold flex items-center gap-2">
            {selectedFiles.some(f => f.type.startsWith("audio/")) ? (
              <FileAudio className="h-5 w-5 text-primary" aria-hidden="true" />
            ) : (
              <FileImage className="h-5 w-5 text-primary" aria-hidden="true" />
            )}
            Selected Files ({selectedFiles.length})
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearFiles}
            className="h-8 w-8 min-h-10 min-w-10 focus:ring-4 focus:ring-primary/20"
            aria-label="Clear all selected files"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Total files: {selectedFiles.length}</p>
            <p>Total size: {(selectedFiles.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(2)} MB</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4" role="list" aria-label="Selected files for verification">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group" role="listitem">
                {file.type.startsWith("image/") ? (
                  <div className="aspect-square border rounded-lg bg-muted/20 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview of ${file.name} (${index + 1} of ${selectedFiles.length})`}
                      className="w-full h-full object-cover transition-all duration-200"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200" />
                  </div>
                ) : (
                  <div className="aspect-square border rounded-lg bg-muted/20 overflow-hidden flex items-center justify-center">
                    <FileAudio className="h-12 w-12 text-primary" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1 truncate" title={file.name}>
                  {file.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={cn(isDragOver && "dragover")}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById("file-input")?.click()}
      role="button"
      tabIndex={0}
      aria-label="Upload area for media files"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          document.getElementById("file-input")?.click()
        }
      }}
    >
      <div className="flex flex-col items-center gap-4 p-6 sm:p-8 md:p-12 text-center cursor-pointer 
        bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] 
        border border-white/10 
        shadow-[0_0_30px_hsl(var(--primary)/0.1)] 
        rounded-[var(--radius-lg)] 
        transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/20 upload-area">
        <div
          className="p-3 rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0]"
          aria-hidden="true"
        >
          <Upload className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
        </div>

        <div className="space-y-2 text-center">
          <h3 className="sm:text-xl font-semibold text-white">Upload Media for Verification</h3>
          <p className="text-muted-foreground text-sm sm:text-base">
            Drag and drop your files here, or click to browse files
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Supports: JPG, PNG, WebP, MP3, WAV (Max 10MB each) • Multiple files supported
          </p>
        </div>

        <Button
          variant="outline"
          className="mt-4 min-h-10 focus:ring-4 focus:ring-primary/20"
          onClick={(e) => {
            e.stopPropagation()
            document.getElementById("file-input")?.click()
          }}
        >
          Browse Files
        </Button>

        <div className="w-full mt-6 pt-6 border-t border-border">
          <div className="flex items-center gap-2 mb-3 justify-center">
            <Link className="h-4 w-4 text-[hsl(var(--primary))]" aria-hidden="true" />
            <h4 className="text-sm font-medium text-white">Or add from URL</h4>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md mx-auto">
            <Input
              type="url"
              placeholder="Paste media URL here..."
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleUrlSubmit()
                }
              }}
              className="flex-1 focus:ring-4 focus:ring-primary/20 text-md"
              aria-label="Media URL input"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleUrlSubmit()
              }}
              disabled={!mediaUrl.trim() || isLoadingUrl}
              className="min-h-10 focus:ring-4 focus:ring-primary/20 bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0]"
              size="sm"
              aria-label={isLoadingUrl ? "Loading media from URL" : "Add media from URL"}
            >
              {isLoadingUrl ? "Loading..." : "Add File"}
            </Button>
          </div>
        </div>
      </div>

      <input
        id="file-input"
        type="file"
        accept="image/*,audio/*"
        multiple
        onChange={handleFileInput}
        className="sr-only"
        aria-describedby="file-input-description"
      />
      <div id="file-input-description" className="sr-only">
        Select media files for verification. Supports JPG, PNG, WebP, MP3, and WAV formats up to 10MB each. Multiple files can be selected.
      </div>
    </Card>
  )
}
