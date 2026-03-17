import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import type { LoginRequest, RegisterRequest } from '@/types'

function sessionToUser(session: { user_id: string | number; role: 'admin' | 'customer' }) {
  return {
    id: String(session.user_id),
    role: session.role,
    // backend login response does not include these fields
    phone_number: '',
    createdAt: new Date().toISOString(),
  }
}

export function useLogin() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.logIn(data),
    onSuccess: (session) => {
      if (session.role !== 'admin') {
        useAuthStore.getState().logout()
        toast.error('Admin account is required.')
        navigate('/admin/login')
        return
      }

      setAuth(sessionToUser(session), session.access_token)
      toast.success('Welcome back!')
      navigate('/admin')
    },
    onError: () => toast.error('Invalid phone or password.'),
  })
}

export function useSignUp() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.signUp(data),
    onSuccess: (session) => {
      setAuth(sessionToUser(session), session.access_token)
      toast.success('Account created successfully!')
      navigate(session.role === 'admin' ? '/admin' : '/')
    },
    onError: () => toast.error('Sign up failed. Please try again.'),
  })
}

export function useLogout() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      // clear local auth regardless of server response
      logout()
      navigate('/')
      toast.success('Logged out successfully.')
    },
  })
}
