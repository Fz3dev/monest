import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2, Sparkles } from 'lucide-react'
import { supabase } from '../../lib/supabase'
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

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [error, setError] = useState('')

  const isSignup = mode === 'signup'

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

    setLoading(true)

    try {
      const { error: authError } = isSignup
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        setError(translateError(authError.message))
      }
    } catch {
      setError('Une erreur inattendue est survenue')
    } finally {
      setLoading(false)
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setError('Veuillez entrer votre email')
      return
    }

    setError('')
    setMagicLinkLoading(true)

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({ email })

      if (authError) {
        setError(translateError(authError.message))
      } else {
        setMagicLinkSent(true)
      }
    } catch {
      setError('Une erreur inattendue est survenue')
    } finally {
      setMagicLinkLoading(false)
    }
  }

  function toggleMode() {
    setMode(isSignup ? 'login' : 'signup')
    setError('')
    setConfirmPassword('')
    setMagicLinkSent(false)
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          <Card className="text-center p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
            </motion.div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Lien envoye !
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              Un lien de connexion a ete envoye a{' '}
              <span className="text-brand-light font-medium">{email}</span>.
              Verifiez votre boite de reception.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMagicLinkSent(false)}
              className="w-full"
            >
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
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex items-center justify-center gap-2 mb-3"
          >
            <Sparkles className="w-6 h-6 text-brand" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-brand to-brand-light bg-clip-text text-transparent">
              Monest
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="text-text-secondary text-sm"
          >
            Votre budget, simplifie.
          </motion.p>
        </div>

        {/* Auth Card */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Input
                label="Email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                suffix={<Mail className="w-4 h-4" />}
              />
            </div>

            {/* Password */}
            <div className="relative">
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
            </div>

            {/* Confirm Password (signup only) */}
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

            {/* Error */}
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

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Chargement...
                </>
              ) : isSignup ? (
                'Creer un compte'
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-text-muted">ou</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Magic Link */}
          <Button
            variant="secondary"
            size="md"
            disabled={magicLinkLoading}
            onClick={handleMagicLink}
            className="w-full flex items-center justify-center gap-2"
          >
            {magicLinkLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Connexion par lien magique
              </>
            )}
          </Button>

          {/* Toggle mode */}
          <p className="text-center text-sm text-text-secondary mt-5">
            {isSignup ? 'Deja un compte ?' : 'Pas encore de compte ?'}{' '}
            <button
              type="button"
              onClick={toggleMode}
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
