import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Mail, Eye, EyeOff, Loader2, Users, Sparkles } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'

const ERROR_MAP = {
  'Invalid login credentials': 'Email ou mot de passe incorrect',
  'User already registered': 'Un compte existe deja avec cet email',
  'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caracteres',
}

function translateError(message) {
  return ERROR_MAP[message] || message
}

export default function InvitePage({ householdId }) {
  const [household, setHousehold] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState('')

  const isSignup = mode === 'signup'

  useEffect(() => {
    if (!isSupabaseConfigured() || !householdId) {
      setNotFound(true)
      setLoading(false)
      return
    }

    supabase
      .from('households')
      .select('id, name, person_a_name, person_a_color, config_model')
      .eq('id', householdId)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setNotFound(true)
        } else {
          setHousehold(data)
          // Store invite info so App can join after auth
          sessionStorage.setItem('monest-invite', householdId)
        }
        setLoading(false)
      })
  }, [householdId])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (isSignup && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres')
      return
    }

    setAuthLoading(true)

    try {
      const { error: authError } = isSignup
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        setError(translateError(authError.message))
      }
      // On success, App.jsx will detect session + invite token and handle join
    } catch {
      setError('Une erreur inattendue est survenue')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setError('Veuillez entrer votre email')
      return
    }

    setError('')
    setAuthLoading(true)

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({ email })
      if (authError) {
        setError(translateError(authError.message))
      } else {
        setError('')
        setMode('magic-sent')
      }
    } catch {
      setError('Une erreur inattendue est survenue')
    } finally {
      setAuthLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <Card className="text-center p-8 max-w-sm w-full">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-lg font-semibold mb-2">Invitation introuvable</h2>
          <p className="text-text-secondary text-sm mb-4">
            Ce lien d'invitation n'est plus valide ou le foyer n'existe pas.
          </p>
          <Button variant="secondary" onClick={() => window.location.href = '/'} className="w-full">
            Retour a l'accueil
          </Button>
        </Card>
      </div>
    )
  }

  if (mode === 'magic-sent') {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm"
        >
          <Card className="text-center p-8">
            <Mail className="w-12 h-12 text-brand mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Lien envoye !</h2>
            <p className="text-text-secondary text-sm mb-4">
              Verifiez votre boite mail <span className="text-brand-light font-medium">{email}</span> pour vous connecter et rejoindre le budget de {household.person_a_name}.
            </p>
            <Button variant="ghost" size="sm" onClick={() => setMode('login')} className="w-full">
              Retour
            </Button>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <Sparkles className="w-6 h-6 text-brand" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand to-brand-light bg-clip-text text-transparent">
              Monest
            </h1>
          </motion.div>
        </div>

        {/* Invite banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="!border-brand/20 !bg-brand/5 mb-4 text-center">
            <div className="flex justify-center mb-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                style={{ backgroundColor: household.person_a_color || '#6C63FF' }}
              >
                {household.person_a_name?.[0]?.toUpperCase()}
              </div>
            </div>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Users size={14} className="text-brand" />
              <span className="text-xs font-medium text-brand uppercase tracking-wider">Invitation</span>
            </div>
            <h2 className="text-lg font-semibold">
              {household.person_a_name} vous invite
            </h2>
            <p className="text-text-secondary text-sm mt-1">
              a rejoindre le budget partage <span className="font-medium text-text-primary">{household.name}</span>
            </p>
          </Card>
        </motion.div>

        {/* Auth form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              suffix={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <AnimatePresence mode="wait">
              {isSignup && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Input
                    label="Confirmer le mot de passe"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    error={
                      confirmPassword && password !== confirmPassword
                        ? 'Les mots de passe ne correspondent pas'
                        : undefined
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl px-3 py-2.5"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Chargement...
                </>
              ) : isSignup ? (
                'Creer un compte et rejoindre'
              ) : (
                'Se connecter et rejoindre'
              )}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-text-muted">ou</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          <Button
            variant="secondary"
            size="md"
            disabled={authLoading}
            onClick={handleMagicLink}
            className="w-full flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Lien magique
          </Button>

          <p className="text-center text-sm text-text-secondary mt-5">
            {isSignup ? 'Deja un compte ?' : 'Pas encore de compte ?'}{' '}
            <button
              type="button"
              onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError('') }}
              className="text-brand-light hover:text-brand font-medium transition-colors cursor-pointer"
            >
              {isSignup ? 'Se connecter' : 'Creer un compte'}
            </button>
          </p>
        </Card>
      </motion.div>
    </div>
  )
}
