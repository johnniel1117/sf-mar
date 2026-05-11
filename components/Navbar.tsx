import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavbarProps {
  showBackButton?: boolean
  backHref?: string
  showLogo?: boolean
  animate?: boolean
  fixed?: boolean
  variant?: 'default' | 'dark'
  title?: string
}

export default function Navbar({ 
  showBackButton = false, 
  backHref = '/', 
  showLogo = true,
  animate = false,
  fixed = true,
  variant = 'default',
  title
}: NavbarProps) {
  const isDark = variant === 'dark'
  const bgClass = isDark ? 'bg-[#0D1117]' : 'bg-white'
  const borderClass = isDark ? 'border-[#21262D]' : 'border-gray-200'
  const textClass = isDark ? 'text-white' : 'text-gray-900'
  const hoverClass = isDark ? 'hover:bg-[#1C2128]' : 'hover:bg-gray-100'

  return (
    <nav className={cn(
      "w-full border-b z-50 transition-all duration-200",
      bgClass,
      borderClass,
      fixed && "fixed top-0 left-0 right-0 backdrop-blur-sm",
      animate && "animate-fadeIn"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          {showLogo && (
            <Link 
              href="/" 
              className={cn(
                "flex items-center gap-3 transition-all duration-200",
                animate && "animate-slideInLeft",
                isDark ? 'hover:opacity-80' : 'hover:opacity-75'
              )}
            >
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isDark ? 'bg-[#161B22]' : 'bg-gray-100')}>
                <img
                  src={isDark ? "/sf-light.png" : "/sf-express.png"}
                  alt="SF Express Logo"
                  className="h-10 w-auto"
                />
              </div>
              <div className="flex flex-col">
                <span className={cn("text-lg font-bold", textClass)}>SF EXPRESS</span>
                {title && <span className={cn("text-xs font-medium", isDark ? 'text-[#6E7681]' : 'text-gray-500')}>{title}</span>}
              </div>
            </Link>
          )}

          {/* Back Button (when applicable) */}
          {showBackButton && (
            <Link
              href={backHref}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium",
                animate && "animate-slideInRight",
                isDark 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}