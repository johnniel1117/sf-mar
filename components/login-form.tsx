"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { MessageCircle, Mail, Lock, Eye, EyeOff } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signIn(email, password)
      router.push("/admin")
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      })
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex bg-green-50 items-center justify-center p-4 font-poppins bg-cover bg-center relative"
      style={{ backgroundImage: "url('/lynbert.jpg')" }}
    >
      <div className="absolute inset-0  backdrop-blur-lg z-0"></div>
      <div className="max-w-md w-full relative z-10">
        <Card className="bg-white border-0 shadow-md rounded-3xl">
          <CardContent className="p-10">
            <div className="text-center space-y-8">
              {/* Logo */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Title */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access</h2>
                <p className="text-gray-600 text-md">Trusted team member login</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-2xl text-lg bg-white shadow-sm font-poppins"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-14 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-2xl text-lg bg-white shadow-sm font-poppins"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-green-500 hover:bg-green-600 text-white font-semibold text-lg rounded-2xl shadow-lg transition-all duration-200 font-poppins"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              {/* Links */}
              {/* <div className="text-center space-y-2">
                <p className="text-gray-500 text-sm font-poppins">Don't have an account?</p>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/admin/signup")}
                  className="text-green-500 hover:bg-green-50 font-semibold font-poppins"
                >
                  Create account
                </Button>
              </div> */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}