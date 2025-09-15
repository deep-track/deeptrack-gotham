'use client';

import { useEffect, useMemo, useRef, useState } from "react"
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
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [resumingOrderId, setResumingOrderId] = useState<string | null>(null)
  const fetchAbortRef = useRef<AbortController | null>(null)

  const refreshHistory = async () => {
    // cancel any in-flight
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort()
    }
    const controller = new AbortController()
    fetchAbortRef.current = controller

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/orders', { signal: controller.signal })
      if (res.status === 401) {
        setOrders([])
        return
      }
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || `Failed to load orders (${res.status})`)
      }
      const json = await res.json()
      setOrders(Array.isArray(json) ? json : [])
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      setError(e?.message || 'Failed to load history')
    } finally {
      setLoading(false)
      fetchAbortRef.current = null
    }
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (cancelled) return
      await refreshHistory()
    }
    load()

    // Auto-refresh every 60s when tab visible
    const intervalMs = 60000
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      refreshHistory()
    }, intervalMs)
    return () => { cancelled = true; clearInterval(id); if (fetchAbortRef.current) fetchAbortRef.current.abort() }
  }, [])

  const mapResultLike = (r: any, idx: number) => {
    // Support both ResultData shape and OrderRecord.result shape
    const imageBase64 = r.imageBase64 || r?.result?.imageBase64
    const fileMeta = r.fileMeta || r?.result?.fileMeta || { name: 'File', size: 0 }
    const analysis = r.result?.analysis ? r.result.analysis : r.result || r?.analysis
    const ts = r.timestamp || r.updatedAt || r.createdAt || new Date().toISOString()
    const date = new Date(ts)
    const status = (analysis?.status || 'UNKNOWN') as string
    const score = typeof analysis?.score === 'number' ? analysis.score : 0
    return {
      id: idx,
      fileName: fileMeta.name,
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      verdict: status === "AUTHENTIC" ? "Authentic" : "Synthetic",
      confidence: Math.round(score * 100 || score || 0),
      size: `${(fileMeta.size / 1024).toFixed(1)} KB`,
      thumbnail: imageBase64,
    }
  }

  const orderBackedItems = (orders || [])
    .filter((o: any) => o?.result)
    .map((o: any, i: number) => mapResultLike({ result: o.result, updatedAt: o.updatedAt }, i))

  const localItems = (resultData ?? []).map((r, i) => mapResultLike(r, i))

  // Prefer server-backed items when available; append local items not present
  const historyItems = orderBackedItems.length > 0 ? orderBackedItems : localItems

  const formatAmount = (cents?: number) => {
    if (typeof cents !== 'number') return '—'
    return `$${(cents / 100).toFixed(2)}`
  }

  const resumePayment = async (orderId: string) => {
    try {
      setResumingOrderId(orderId)
      const resp = await fetch('/api/create-paystack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      })
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '')
        throw new Error(txt || `Failed to resume payment (${resp.status})`)
      }
      const data = await resp.json()
      const url = data.authorization_url
      if (url) {
        window.location.href = url
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to resume payment')
    } finally {
      setResumingOrderId(null)
    }
  }

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
        {loading && (
          <div className="col-span-2 md:col-span-4 text-sm text-muted-foreground">Loading history…</div>
        )}
        {error && (
          <div className="col-span-2 md:col-span-4 text-sm text-red-500">{error}</div>
        )}
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
              {historyItems.length > 0
                ? Math.round(historyItems.reduce((acc, item) => acc + item.confidence, 0) / historyItems.length)
                : 0}%
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

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refreshHistory} disabled={loading}>
                Refresh
              </Button>
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
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View (Orders) */}
      <Card className="shadow-sm hidden lg:block bg-muted/95 border dark:border-white/20 border-foreground/20">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/20">
                <tr className="text-left">
                  <th className="p-4 font-medium text-muted-foreground">Order</th>
                  <th className="p-4 font-medium text-muted-foreground">Uploads</th>
                  <th className="p-4 font-medium text-muted-foreground">Status</th>
                  <th className="p-4 font-medium text-muted-foreground">Amount</th>
                  <th className="p-4 font-medium text-muted-foreground">Updated</th>
                  <th className="p-4 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const updated = new Date(o.updatedAt)
                  return (
                    <tr key={o.id} className="border-b history-row">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-sm">{o.id}</p>
                          <p className="text-xs text-muted-foreground">{o.paymentRef || '—'}</p>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        {Array.isArray(o.uploadIds) ? o.uploadIds.length : 0}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-xs">
                          {o.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">{formatAmount(o.totalAmountCents)}</td>
                      <td className="p-4 text-sm">
                        {updated.toLocaleDateString()} {updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4">
                        {o.status === 'awaiting_payment' || o.status === 'payment_pending' ? (
                          <Button size="sm" className="bg-black text-white" onClick={() => resumePayment(o.id)} disabled={resumingOrderId === o.id}>
                            {resumingOrderId === o.id ? 'Redirecting…' : 'Resume payment'}
                          </Button>
                        ) : o.status === 'paid' || o.status === 'processing' ? (
                          <Button size="sm" variant="outline" onClick={() => router.push(`/results?orderId=${encodeURIComponent(o.id)}${o.paymentRef ? `&ref=${encodeURIComponent(o.paymentRef)}` : ''}`)}>
                            View status
                          </Button>
                        ) : o.status === 'completed' && o.result ? (
                          <Button size="sm" onClick={() => router.push(`/results?orderId=${encodeURIComponent(o.id)}`)}>
                            View results
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No orders found</p>
              <p className="text-sm">Complete a verification to see it here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}