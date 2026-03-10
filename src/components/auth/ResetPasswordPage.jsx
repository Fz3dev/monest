import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { Eye, EyeOff, Loader2, CheckCircle2, Sparkles, Lock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'

export default function ResetPasswordPage({ onComplete }) {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError(t('auth.passwordMinLength'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordsNoMatch'))
      return
    }

    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.updateUser({ password })
      if (authError) {
        setError(authError.message)
      } else {
        setSuccess(true)
        setTimeout(() => onComplete(), 2000)
      }
    } catch {
      setError(t('auth.unexpectedError'))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
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
              {t('auth.resetPasswordSuccess')}
            </h2>
            <p className="text-text-secondary text-sm">
              {t('auth.resetPasswordSuccessDescription')}
            </p>
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
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-6 h-6 text-brand" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-brand to-brand-light bg-clip-text text-transparent">
              Monest
            </h1>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {t('auth.resetPasswordTitle')}
              </h2>
              <p className="text-text-secondary text-xs">
                {t('auth.resetPasswordDescription')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.newPassword')}
              type={showPassword ? 'text' : 'password'}
              placeholder={'\u2022'.repeat(8)}
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

            <Input
              label={t('auth.confirmNewPassword')}
              type={showPassword ? 'text' : 'password'}
              placeholder={'\u2022'.repeat(8)}
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
              disabled={loading}
              className="w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('auth.resetPasswordButton')
              )}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
