import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavbarProps {
  showBackButton?: boolean
  backHref?: string
  showLogo?: boolean
  animate?: boolean
  fixed?: boolean
}

export default function Navbar({ 
  showBackButton = false, 
  backHref = '/', 
  showLogo = true,
  animate = false,
  fixed = true // Default to fixed
}: NavbarProps) {
  return (
    <nav className={cn(
      "w-full bg-white  border-b border-gray-200 z-50",
      fixed && "fixed top-0 left-0 right-0",
      animate && "animate-fadeIn"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          {showLogo && (
            <Link 
              href="/" 
              className={cn(
                "flex items-center gap-3 hover:opacity-80 transition-opacity",
                animate && "animate-slideInLeft"
              )}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <img
                  src="/sf-express.png"
                  alt="SF Express Logo"
                  className="h-10 w-auto"
                />
              </div>
              <span className="text-lg font-bold text-gray-900">SF EXPRESS</span>
            </Link>
          )}

          {/* Back Button (when applicable) */}
          {showBackButton && (
            <Link
              href={backHref}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 font-medium",
                animate && "animate-slideInRight"
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