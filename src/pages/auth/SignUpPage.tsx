import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useSignUp } from '@/hooks/useAuth'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Card } from '@/components/Card'

export function SignUpPage() {
  const [phone_number, setPhone] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  const signUp = useSignUp()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await signUp.mutateAsync({ phone_number, name: name || undefined, password })
  }

  return (
    <Card>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-stone-800">
          Create account
        </h1>
        <p className="mt-1 text-sm text-stone-400">
          Join us — it only takes a moment
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Your name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex"
          autoFocus
        />
        <Input
          label="Phone number"
          type="tel"
          value={phone_number}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 000-0000"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password"
          required
        />
        <Button
          type="submit"
          fullWidth
          loading={signUp.isPending}
        >
          Create account <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-coffee-700 hover:text-coffee-800">
          Sign in
        </Link>
      </p>
    </Card>
  )
}
