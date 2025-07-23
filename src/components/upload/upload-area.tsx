import { useCallback, useState } from "react"
import { Upload, FileImage, X, Link } from "lucide-react"
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
  const [imageUrl, setImageUrl] = useState("")
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
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    const rejectedFiles = files.length - imageFiles.length
    
    if (imageFiles.length > 0) {
      onFileSelect(imageFiles)
    }
    
    if (rejectedFiles > 0) {
      toast({
        title: "Some files rejected",
        description: `${rejectedFiles} file${rejectedFiles > 1 ? 's' : ''} rejected. Only image files are supported.`,
        variant: "destructive"
      })
    }
  }, [onFileSelect, toast])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    const rejectedFiles = files.length - imageFiles.length
    
    if (imageFiles.length > 0) {
      onFileSelect(imageFiles)
    }
    
    if (rejectedFiles > 0) {
      toast({
        title: "Some files rejected",
        description: `${rejectedFiles} file${rejectedFiles > 1 ? 's' : ''} rejected. Only image files are supported.`,
        variant: "destructive"
      })
    }
    
    // Reset input to allow selecting the same files again
    e.target.value = ""
  }, [onFileSelect, toast])

  const handleUrlSubmit = useCallback(async () => {
    if (!imageUrl.trim()) return

    setIsLoadingUrl(true)
    try {
      // Validate URL format
      const url = new URL(imageUrl.trim())
      
      // Check if URL points to an image
      const imageResponse = await fetch(url.toString())
const contentType = imageResponse.headers.get('content-type')

if (!contentType || !contentType.startsWith('image/')) {
  throw new Error('URL does not point to a valid image')
}

const blob = await imageResponse.blob()
      
      const fileName = url.pathname.split('/').pop() || 'image-from-url'
      const file = new File([blob], fileName, { type: blob.type })
      
      onFileSelect([file])
      setImageUrl("")
      
      toast({
        title: "Image loaded successfully",
        description: "Image from URL has been added for verification",
      })
    } catch (error) {
      console.error('Error loading image from URL:', error)
      toast({
        title: "Failed to load image",
        description: error instanceof Error ? error.message : "Please check the URL and try again",
        variant: "destructive"
      })
    } finally {
      setIsLoadingUrl(false)
    }
  }, [imageUrl, onFileSelect, toast])

  if (selectedFiles.length > 0) {
    return (
      <Card className="relative p-6 shadow-lg" role="region" aria-labelledby="selected-images-heading">
        <div className="flex items-center justify-between mb-4">
          <h3 id="selected-images-heading" className="text-lg font-semibold flex items-center gap-2">
            <FileImage className="h-5 w-5 text-primary" aria-hidden="true" />
            Selected Images ({selectedFiles.length})
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearFiles}
            className="h-8 w-8 min-h-10 min-w-10 focus:ring-4 focus:ring-primary/20"
            aria-label="Clear all selected images"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Total files: {selectedFiles.length}</p>
            <p>Total size: {(selectedFiles.reduce((acc, file) => acc + file.size, 0) / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4" role="list" aria-label="Selected images for verification">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group" role="listitem">
                <div className="aspect-square border rounded-lg bg-muted/20 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview of ${file.name} (${index + 1} of ${selectedFiles.length})`}
                    className="w-full h-full object-cover transition-all duration-200"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200" />
                </div>
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
      className={cn(
        "upload-area p-6 sm:p-8 md:p-12 text-center cursor-pointer transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/20",
        isDragOver && "dragover"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
      role="button"
      tabIndex={0}
      aria-label="Upload area for image files"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          document.getElementById('file-input')?.click()
        }
      }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-primary/10" aria-hidden="true">
          <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-semibold">Upload Images for Verification</h3>
          <p className="text-muted-foreground text-sm sm:text-base">
            Drag and drop your images here, or click to browse files
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Supports: JPG, PNG, WebP (Max 10MB each) • Multiple files supported
          </p>
        </div>

        <Button 
          variant="outline" 
          className="mt-4 min-h-10 focus:ring-4 focus:ring-primary/20"
          onClick={(e) => {
            e.stopPropagation()
            document.getElementById('file-input')?.click()
          }}
        >
          Browse Image Files
        </Button>

        <div className="w-full mt-6 pt-6 border-t border-border">
          <div className="flex items-center gap-2 mb-3 justify-center">
            <Link className="h-4 w-4 text-primary" aria-hidden="true" />
            <h4 className="text-sm font-medium">Or add from URL</h4>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md mx-auto">
            <Input
              type="url"
              placeholder="Paste image URL here..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleUrlSubmit()
                }
              }}
              className="flex-1 focus:ring-4 focus:ring-primary/20"
              aria-label="Image URL input"
              onClick={(e) => e.stopPropagation()}
            />
            <Button 
              onClick={(e) => {
                e.stopPropagation()
                handleUrlSubmit()
              }}
              disabled={!imageUrl.trim() || isLoadingUrl}
              className="min-h-10 focus:ring-4 focus:ring-primary/20"
              size="sm"
              aria-label={isLoadingUrl ? "Loading image from URL" : "Add image from URL"}
            >
              {isLoadingUrl ? "Loading..." : "Add Image"}
            </Button>
          </div>
        </div>
      </div>

      <input
        id="file-input"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInput}
        className="sr-only"
        aria-describedby="file-input-description"
      />
      <div id="file-input-description" className="sr-only">
        Select image files for verification. Supports JPG, PNG, and WebP formats up to 10MB each. Multiple files can be selected.
      </div>
    </Card>
  )
}