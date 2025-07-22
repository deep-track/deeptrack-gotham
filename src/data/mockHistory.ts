export type HistoryItem = {
  id: number
  fileName: string
  date: string
  time: string
  verdict: "Authentic" | "Synthetic"
  confidence: number
  size: string
  thumbnail: string
}

export const mockHistory: HistoryItem[] = [
  {
    id: 1,
    fileName: "portrait_conference.jpg",
    date: "2024-01-15",
    time: "14:30",
    verdict: "Authentic",
    confidence: 87,
    size: "2.4 MB",
    thumbnail: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=100&h=100&fit=crop",
  },
  {
    id: 2,
    fileName: "social_media_post.png",
    date: "2024-01-15",
    time: "12:15",
    verdict: "Synthetic",
    confidence: 94,
    size: "1.8 MB",
    thumbnail: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
  },
  {
    id: 3,
    fileName: "news_article_image.jpg",
    date: "2024-01-14",
    time: "09:45",
    verdict: "Authentic",
    confidence: 92,
    size: "3.2 MB",
    thumbnail: "https://images.unsplash.com/photo-1494790108755-2616b35f2b50?w=100&h=100&fit=crop",
  },
  {
    id: 4,
    fileName: "profile_picture.jpg",
    date: "2024-01-14",
    time: "16:20",
    verdict: "Synthetic",
    confidence: 78,
    size: "1.1 MB",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  },
  {
    id: 5,
    fileName: "event_photo.jpg",
    date: "2024-01-13",
    time: "11:30",
    verdict: "Authentic",
    confidence: 95,
    size: "4.1 MB",
    thumbnail: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
  },
]
