import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { Mail, Eye, EyeOff, Loader2, CheckCircle2, UserPlus, Inbox, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'

function useErrorTranslation() {
  const { t } = useTranslation()
  const ERROR_MAP = {
    'Invalid login credentials': t('auth.errors.invalidCredentials'),
    'User already registered': t('auth.errors.userExists'),
    'Password should be at least 6 characters': t('auth.errors.passwordTooShort'),
    'Email rate limit exceeded': t('auth.errors.rateLimited'),
    'For security purposes, you can only request this after 60 seconds.': t('auth.errors.waitBeforeResend'),
  }
  return (message) => ERROR_MAP[message] || message
}

export default function AuthPage({ inviteCode }) {
  const { t } = useTranslation()
  const translateError = useErrorTranslation()

  const [mode, setMode] = useState(inviteCode ? 'signup' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [signupSent, setSignupSent] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [error, setError] = useState('')

  const isSignup = mode === 'signup'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (isSignup && password !== confirmPassword) {
      setError(t('auth.passwordsNoMatch'))
      return
    }

    if (password.length < 6) {
      setError(t('auth.passwordMinLength'))
      return
    }

    setLoading(true)

    try {
      if (isSignup) {
        const redirectTo = inviteCode
          ? `${window.location.origin}?invite=${inviteCode}`
          : window.location.origin
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        })
        if (authError) {
          setError(translateError(authError.message))
        } else if (data?.user && !data.session) {
          setSignupSent(true)
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) {
          setError(translateError(authError.message))
        }
      }
    } catch {
      setError(t('auth.unexpectedError'))
    } finally {
      setLoading(false)
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setError(t('auth.enterEmail'))
      return
    }

    setError('')
    setMagicLinkLoading(true)

    try {
      const redirectTo = inviteCode
        ? `${window.location.origin}?invite=${inviteCode}`
        : window.location.origin
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      })

      if (authError) {
        setError(translateError(authError.message))
      } else {
        setMagicLinkSent(true)
      }
    } catch {
      setError(t('auth.unexpectedError'))
    } finally {
      setMagicLinkLoading(false)
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError(t('auth.enterEmail'))
      return
    }
    setError('')
    setForgotLoading(true)
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}`,
      })
      if (authError) {
        setError(translateError(authError.message))
      } else {
        setForgotSent(true)
      }
    } catch {
      setError(t('auth.unexpectedError'))
    } finally {
      setForgotLoading(false)
    }
  }

  function toggleMode() {
    setMode(isSignup ? 'login' : 'signup')
    setError('')
    setConfirmPassword('')
    setMagicLinkSent(false)
    setForgotMode(false)
    setForgotSent(false)
  }

  // Forgot password: reset link sent confirmation
  if (forgotSent) {
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
              {t('auth.resetLinkSent')}
            </h2>
            <p className="text-text-secondary text-sm mb-4">
              {t('auth.resetLinkSentDescription')}{' '}
              <span className="text-brand-light font-medium">{email}</span>.
              <br />
              {t('auth.resetLinkSentHint')}
            </p>
            <div className="bg-white/[0.04] rounded-xl p-3 mb-6">
              <p className="text-xs text-text-muted">
                {t('auth.spamHint')} <span className="text-text-secondary font-medium">{t('auth.spams')}</span> ou <span className="text-text-secondary font-medium">{t('auth.junkMail')}</span>.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setForgotSent(false); setForgotMode(false) }}
              className="w-full"
            >
              {t('common.back')}
            </Button>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Forgot password: enter email form
  if (forgotMode) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <img src="/logo-crown.png" alt="Monest" className="w-10 h-10" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-brand to-brand-light bg-clip-text text-transparent">
                Monest
              </h1>
            </div>
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-1">
              {t('auth.forgotPasswordTitle')}
            </h2>
            <p className="text-text-secondary text-sm mb-5">
              {t('auth.forgotPasswordDescription')}
            </p>

            <div className="space-y-4">
              <Input
                label={t('auth.emailLabel')}
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                suffix={<Mail className="w-4 h-4" />}
              />

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
                variant="primary"
                size="lg"
                disabled={forgotLoading}
                onClick={handleForgotPassword}
                className="w-full flex items-center justify-center gap-2"
              >
                {forgotLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('auth.sending')}
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    {t('auth.sendResetLink')}
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setForgotMode(false); setError('') }}
                className="w-full flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('common.back')}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    )
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
              {signupSent ? t('auth.checkEmail') : t('auth.linkSent')}
            </h2>

            <p className="text-text-secondary text-sm mb-4">
              {signupSent ? (
                <>
                  {t('auth.confirmationSent')}{' '}
                  <span className="text-brand-light font-medium">{email}</span>.
                  <br />
                  {t('auth.clickLink')}
                </>
              ) : (
                <>
                  {t('auth.loginLinkSent')}{' '}
                  <span className="text-brand-light font-medium">{email}</span>.
                  <br />
                  {t('auth.checkInbox')}
                </>
              )}
            </p>

            <div className="bg-white/[0.04] rounded-xl p-3 mb-6">
              <p className="text-xs text-text-muted">
                {t('auth.spamHint')} <span className="text-text-secondary font-medium">{t('auth.spams')}</span> ou <span className="text-text-secondary font-medium">{t('auth.junkMail')}</span>.
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
                {t('auth.resendEmail')}
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setMagicLinkSent(false); setSignupSent(false) }}
              className="w-full"
            >
              {t('common.back')}
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
            <img src="/logo-crown.png" alt="Monest" className="w-10 h-10" />
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
            {t('auth.tagline')}
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
                  <p className="text-sm font-medium text-text-primary">{t('auth.invited')}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {t('auth.invitedDescription')}
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
                label={t('auth.emailLabel')}
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                suffix={<Mail className="w-4 h-4" />}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Input
                label={t('auth.passwordLabel')}
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
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>

            {/* Forgot password link (login only) */}
            {!isSignup && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => { setForgotMode(true); setError('') }}
                  className="text-sm text-brand hover:text-brand-light font-medium transition-colors cursor-pointer"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
            )}

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
                    label={t('auth.confirmPasswordLabel')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    error={
                      confirmPassword && password !== confirmPassword
                        ? t('auth.passwordsNoMatch')
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
                  {t('common.loading')}
                </>
              ) : isSignup ? (
                t('auth.createAccount')
              ) : (
                t('auth.login')
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-text-muted">{t('common.or')}</span>
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
                {t('auth.sending')}
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                {t('auth.magicLink')}
              </>
            )}
          </Button>

          {/* Toggle mode */}
          <p className="text-center text-sm text-text-secondary mt-5">
            {isSignup ? t('auth.alreadyHaveAccount') : t('auth.noAccount')}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="text-brand-light hover:text-brand font-medium transition-colors cursor-pointer"
            >
              {isSignup ? t('auth.login') : t('auth.createAccount')}
            </button>
          </p>
        </Card>
      </motion.div>
    </div>
  )
}
