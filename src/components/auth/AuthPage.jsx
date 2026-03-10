import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Mail, Eye, EyeOff, Loader2, CheckCircle2, Sparkles, UserPlus, Inbox } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'

const ERROR_MAP = {
  'Invalid login credentials': 'Email ou mot de passe incorrect',
  'User already registered': 'Un compte existe deja avec cet email',
  'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caracteres',
  'Email rate limit exceeded': 'Trop de tentatives. Reessayez dans quelques minutes.',
  'For security purposes, you can only request this after 60 seconds.': 'Veuillez patienter 60 secondes avant de renvoyer.',
}

function translateError(message) {
  return ERROR_MAP[message] || message
}

export default function AuthPage({ inviteCode }) {
  const [mode, setMode] = useState(inviteCode ? 'signup' : 'login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [signupSent, setSignupSent] = useState(false)
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
      if (isSignup) {
        const { data, error: authError } = await supabase.auth.signUp({ email, password })
        if (authError) {
          setError(translateError(authError.message))
        } else if (data?.user && !data.session) {
          // Email confirmation required
          setSignupSent(true)
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) {
          setError(translateError(authError.message))
        }
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

  // Confirmation screen (magic link or signup)
  if (magicLinkSent || signupSent) {
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
              {signupSent ? (
                <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
                  <Inbox className="w-8 h-8 text-brand" />
                </div>
              ) : (
                <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
              )}
            </motion.div>

            <h2 className="text-xl font-semibold text-text-primary mb-2">
              {signupSent ? 'Verifiez votre email' : 'Lien envoye !'}
            </h2>

            <p className="text-text-secondary text-sm mb-4">
              {signupSent ? (
                <>
                  Un email de confirmation a ete envoye a{' '}
                  <span className="text-brand-light font-medium">{email}</span>.
                  <br />
                  Cliquez sur le lien dans l'email pour activer votre compte.
                </>
              ) : (
                <>
                  Un lien de connexion a ete envoye a{' '}
                  <span className="text-brand-light font-medium">{email}</span>.
                  <br />
                  Verifiez votre boite de reception.
                </>
              )}
            </p>

            <div className="bg-white/[0.04] rounded-xl p-3 mb-6">
              <p className="text-xs text-text-muted">
                Vous ne trouvez pas l'email ? Verifiez vos <span className="text-text-secondary font-medium">spams</span> ou <span className="text-text-secondary font-medium">courrier indesirable</span>.
              </p>
            </div>

            {signupSent && (
              <Button
                variant="secondary"
                size="sm"
                disabled={loading}
                onClick={async () => {
                  setLoading(true)
                  await supabase.auth.resend({ type: 'signup', email })
                  setLoading(false)
                  setError('')
                }}
                className="w-full mb-3 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                Renvoyer l'email
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setMagicLinkSent(false); setSignupSent(false) }}
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

        {/* Invite banner */}
        {inviteCode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="!border-brand/30 !bg-brand/5 mb-4 p-4">
              <div className="flex items-center gap-3">
                <UserPlus className="w-5 h-5 text-brand flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Vous avez ete invite(e) !</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Creez un compte ou connectez-vous pour rejoindre le foyer partage.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

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
