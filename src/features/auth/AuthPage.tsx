interface AuthPageProps { mode?: 'login' | 'register' }
export default function AuthPage({ mode = 'login' }: AuthPageProps) {
  return <div className="p-4">Auth {mode} — Em breve</div>
}
