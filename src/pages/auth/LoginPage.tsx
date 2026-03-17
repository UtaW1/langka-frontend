import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useLogin } from '@/hooks/useAuth'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Card } from '@/components/Card'

export function LoginPage() {
  const [phone_number, setPhone] = useState('')
  const [password, setPassword] = useState('')

  const login = useLogin()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!phone_number.trim() || !password.trim()) return
    await login.mutateAsync({ phone_number, password })
  }

  return (
    <Card>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-stone-800">
          Admin login
        </h1>
        <p className="mt-1 text-sm text-stone-400">
          Sign in with your admin phone number
        </p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <Input
          label="Phone number"
          type="tel"
          value={phone_number}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 000-0000"
          autoFocus
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />
        <Button
          type="submit"
          fullWidth
          loading={login.isPending}
        >
          Sign in <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  )
}
