'use client';

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, FileText, Check, X, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/lib/store'



export default function History() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("date")
  const { resultData } = useDashboardStore()

  const historyItems = (resultData ?? []).map((r, i) => {
    const date = new Date(r.timestamp)
    return {
      id: i,
      fileName: r.fileMeta.name,
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      verdict: r.result.status === "AUTHENTIC" ? "Authentic" : "Synthetic",
      confidence: Math.round(r.result.score ?? 0),
      size: `${(r.fileMeta.size / 1024).toFixed(1)} KB`,
      thumbnail: r.imageBase64,
    }
  })

  const filteredHistory = historyItems
    .filter(item => {
      if (activeFilter === "authentic") return item.verdict === "Authentic"
      if (activeFilter === "synthetic") return item.verdict === "Synthetic"
      return true
    })
    .filter(item =>
      item.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.date).getTime() - new Date(a.date).getTime()
      if (sortBy === "confidence") return b.confidence - a.confidence
      return a.fileName.localeCompare(b.fileName)
    })

  return (
    <div className="container-responsive space-y-4 max-w-5xl sm:space-y-6 animate-fade-in  p-6 sm:p-8">
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[hsl(var(--primary))] to-[#7F5AF0] bg-clip-text text-transparent">
          Verification History</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          View and manage your previously verified images
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Verifications */}
        <Card className="bg-muted/95 backdrop-blur-md border border-white/20 rounded-lg shadow-[0_0_30px_rgba(255,255,255,0.05)] transition hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]">
          <CardContent className="pt-2 flex flex-row items-center justify-between gap-2 text-left sm:pt-6 ">
            <div className="text-lg sm:text-4xl font-bold text-white">
              {historyItems.length}
            </div>
            <p className="text-md text-white/60 mt-1">Total Verifications</p>
          </CardContent>
        </Card>

        {/* Authentic Images */}
        <Card className="bg-muted/95 backdrop-blur-md border border-white/20 rounded-lg shadow-[0_0_30px_rgba(255,255,255,0.05)] transition hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]">
          <CardContent className="pt-2 flex flex-row items-center justify-between gap-2 text-left sm:pt-6 ">
            <div className="text-lg sm:text-4xl font-bold text-emerald-500/80 ">
              {historyItems.filter(item => item.verdict === "Authentic").length}
            </div>
            <p className="text-md text-white/60 mt-1">Authentic Images</p>
          </CardContent>
        </Card>

        {/* Synthetic Images */}
        <Card className="bg-muted/95 backdrop-blur-md border border-white/20 rounded-lg shadow-[0_0_30px_rgba(255,255,255,0.05)] transition hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]">
          <CardContent className="pt-2 flex flex-row items-center justify-between gap-2 text-left sm:pt-6 ">
            <div className="text-lg sm:text-4xl font-bold text-red-500/80 ">
              {historyItems.filter(item => item.verdict === "Synthetic").length}
            </div>
            <p className="text-md text-white/60 mt-1">Synthetic Images</p>
          </CardContent>
        </Card>

        {/* Average Confidence */}
        <Card className="bg-muted/95 backdrop-blur-md border border-white/20 rounded-lg shadow-[0_0_30px_rgba(255,255,255,0.05)] transition hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]">
          <CardContent className="pt-2 flex flex-row items-center justify-between gap-2 text-left sm:pt-6 ">
            <div className="text-lg sm:text-4xl font-bold bg-gradient-to-r from-[hsl(var(--primary))]/70 to-[#7F5AF0] text-transparent bg-clip-text">
              {Math.round(
                historyItems.reduce((acc, item) => acc + item.confidence, 0) /
                historyItems.length
              )}
              %
            </div>
            <p className="text-md text-white/60 mt-1">Avg. Confidence</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg bg-muted/95 border dark:border-white/20 border-foreground/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by filename..."
                className="pl-10 text-sm sm:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3">
              {/* Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "all", label: "All Files", count: historyItems.length },
                  { key: "authentic", label: "Authentic", count: historyItems.filter(h => h.verdict === "Authentic").length },
                  { key: "synthetic", label: "Synthetic", count: historyItems.filter(h => h.verdict === "Synthetic").length }
                ].map(filter => (
                  <Button
                    key={filter.key}
                    variant="outline"
                    size="sm"
                    className={cn(
                      'filter-pill rounded-full text-xs sm:text-sm transition-all',
                      activeFilter === filter.key
                        ? 'text-white bg-gradient-to-r from-[hsl(var(--primary))]/70 to-[#7F5AF0]/80 shadow-md'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-white',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--primary))]'
                    )}
                    onClick={() => setActiveFilter(filter.key)}
                  >
                    <span className="hidden sm:inline">{filter.label}</span>
                    <span className="sm:hidden">{filter.label.split(' ')[0]}</span>
                    <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">
                      {filter.count}
                    </Badge>
                  </Button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="confidence">Sort by Confidence</SelectItem>
                  <SelectItem value="name">Sort by Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredHistory.map((item) => (
          <Card key={item.id} className="shadow-sm bg-muted/90 border dark:border-white/20 border-foreground/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted/20 group flex-shrink-0">

                  <Image
                    src={item.thumbnail}
                    alt="Thumbnail"
                    width={80}
                    height={80}
                    className="object-cover rounded-lg"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <p className="font-medium text-sm truncate">{item.fileName}</p>
                    <p className="text-xs text-muted-foreground">{item.size}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">{item.date}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${item.verdict === "Authentic"
                        ? "border-success text-success bg-success/10"
                        : "border-destructive text-destructive bg-destructive/10"
                        }`}
                    >
                      {item.verdict === "Authentic" ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <X className="h-3 w-3 mr-1" />
                      )}
                      {item.verdict}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{item.confidence}%</span>
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${item.verdict === "Authentic" ? "bg-success" : "bg-destructive"
                            }`}
                          style={{ width: `${item.confidence}%` }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => {
                        const data = {
                          imageBase64: item.thumbnail,
                          fileMeta: {
                            name: item.fileName,
                            type: item.fileName.includes('.jpg') ? 'image/jpeg' : 'image/png',
                            size: item.size,
                          },
                          result: {
                            confidence: item.confidence,
                            isAuthentic: item.verdict === "Authentic",
                            processingTime: Math.floor(Math.random() * 2000) + 1000,
                          },
                          timestamp: `${item.date}T${item.time}:00.000Z`,
                        };

                        localStorage.setItem('verificationData', JSON.stringify(data));
                        router.push('/results');
                      }}
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <Card className="shadow-sm hidden lg:block bg-muted/95 border dark:border-white/20 border-foreground/20">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/20">
                <tr className="text-left">
                  <th className="p-4 font-medium text-muted-foreground">Image</th>
                  <th className="p-4 font-medium text-muted-foreground">File Details</th>
                  <th className="p-4 font-medium text-muted-foreground">Date & Time</th>
                  <th className="p-4 font-medium text-muted-foreground">Verdict</th>
                  <th className="p-4 font-medium text-muted-foreground">Confidence</th>
                  <th className="p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="border-b history-row cursor-pointer">
                    <td className="p-4">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted/20 group">
                        <img
                          src={item.thumbnail}
                          alt={item.fileName}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-sm truncate max-w-xs">{item.fileName}</p>
                        <p className="text-xs text-muted-foreground">{item.size}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-sm">{item.date}</p>
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={item.verdict === "Authentic"
                          ? "border-success text-success bg-success/10"
                          : "border-destructive text-destructive bg-destructive/10"
                        }
                      >
                        {item.verdict === "Authentic" ? (
                          <Check className="h-3 w-3 mr-1" />
                        ) : (
                          <X className="h-3 w-3 mr-1" />
                        )}
                        {item.verdict}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{item.confidence}%</span>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${item.verdict === "Authentic" ? "bg-success" : "bg-destructive"
                              }`}
                            style={{ width: `${item.confidence}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          const data = {
                            imageBase64: item.thumbnail,
                            fileMeta: {
                              name: item.fileName,
                              type: item.fileName.includes('.jpg') ? 'image/jpeg' : 'image/png',
                              size: item.size,
                            },
                            result: {
                              confidence: item.confidence,
                              isAuthentic: item.verdict === "Authentic",
                              processingTime: Math.floor(Math.random() * 2000) + 1000
                            },
                            timestamp: `${item.date}T${item.time}:00.000Z`
                          }

                          const query = encodeURIComponent(JSON.stringify(data))
                          router.push(`/results?data=${query}`)
                        }}
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredHistory.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No files found</p>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}