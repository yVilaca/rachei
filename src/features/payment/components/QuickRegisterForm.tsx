import { useState } from 'react'
import { useAuthStore } from '../../../stores/auth.store'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Button } from '../../../components/ui/button'

interface QuickRegisterFormProps {
  onComplete: () => void
}

export default function QuickRegisterForm({ onComplete }: QuickRegisterFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const register = useAuthStore((s) => s.register)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) return
    register(name, email, 'mock-password')
    onComplete()
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-card">
      <p className="font-heading text-base font-bold text-[#15151A]">Criar conta rápida</p>
      <p className="mt-1 text-xs text-muted">Para confirmar o pagamento, crie sua conta em segundos.</p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs font-semibold text-[#15151A]">Nome</Label>
          <Input
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border-border bg-[#FAFAFC] text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs font-semibold text-[#15151A]">E-mail</Label>
          <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border-border bg-[#FAFAFC] text-sm"
          />
        </div>
        <Button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-brand to-brand-light font-bold text-white shadow-float"
        >
          Criar conta e confirmar
        </Button>
      </form>
    </div>
  )
}
