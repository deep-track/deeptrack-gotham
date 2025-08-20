import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()
   const titleColors: Record<string, string> = {
    default: "text-green-500",
    destructive: "text-red-500",
  }

  return (
    <ToastProvider>
{toasts.map(function ({ id, title, description, action, variant = "default", ...props }) {
   const safeVariant = variant ?? "default"; 
  return (
    <Toast
      key={id}
      {...props}
      className="bg-black/90 text-white backdrop-blur-md rounded-xl p-6 w-80 flex flex-col gap-4 shadow-[hsl(var(--primary))] shadow-sm border border-white/20"
    >
      <div className="grid gap-1">
 {title && (
          <ToastTitle className={titleColors[safeVariant]}>
            {title}
          </ToastTitle>
        )}        {description && <ToastDescription>{description}</ToastDescription>}
      </div>
      {action}
      <ToastClose />
    </Toast>
  )
})}
      
      {/* Center the ToastViewport */}
      <ToastViewport className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]" />
    </ToastProvider>
  )
}
