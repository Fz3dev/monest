import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { X, Share, Download, Plus, MoreVertical } from 'lucide-react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

function isIOSChrome(): boolean {
  return /CriOS/.test(navigator.userAgent)
}

function isIOSFirefox(): boolean {
  return /FxiOS/.test(navigator.userAgent)
}

function isNotSafariOnIOS(): boolean {
  return isIOSChrome() || isIOSFirefox()
}

export default function InstallPrompt() {
  const { t } = useTranslation()
  const { canPrompt, showIOSGuide, isInstalled, isIOS, promptInstall, dismiss } = useInstallPrompt()
  const [showSteps, setShowSteps] = useState(false)

  // Don't render if already installed or nothing to show
  if (isInstalled || (!canPrompt && !showIOSGuide)) return null

  async function handleInstall(): Promise<void> {
    const outcome = await promptInstall()
    if (outcome === 'dismissed') dismiss()
  }

  const notSafari = isNotSafariOnIOS()

  return (
    <AnimatePresence>
      {/* Step-by-step guide (iOS Safari / iOS not-Safari) */}
      {showSteps && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 inset-x-0 z-[60] bg-bg-primary border-t border-white/[0.08] rounded-t-3xl p-5 pb-8"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold">Installer Monest</h3>
            <button
              onClick={() => { setShowSteps(false); dismiss() }}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-text-secondary"
              aria-label={t('common.close')}
            >
              <X size={20} />
            </button>
          </div>

          {isIOS && notSafari ? (
            /* iOS but NOT Safari — redirect to Safari first */
            <>
              <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-4">
                <p className="text-sm text-warning font-medium mb-1">Ouvrez Safari pour installer</p>
                <p className="text-xs text-text-secondary">
                  L'installation sur l'écran d'accueil n'est possible que depuis <strong className="text-white">Safari</strong>.
                  Copiez le lien ci-dessous et ouvrez-le dans Safari.
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href)
                }}
                className="w-full py-3 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand/90 transition-colors"
              >
                Copier le lien
              </button>
            </>
          ) : isIOS ? (
            /* iOS Safari — step by step */
            <>
              <ol className="space-y-4">
                <li className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand text-white text-xs font-semibold flex items-center justify-center">1</span>
                  <span className="text-sm text-text-secondary">
                    Appuyez sur <Share size={16} className="inline text-brand -mt-0.5" /> <strong className="text-white">Partager</strong> en bas de l'écran
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand text-white text-xs font-semibold flex items-center justify-center">2</span>
                  <span className="text-sm text-text-secondary">
                    Faites défiler et appuyez sur <Plus size={14} className="inline text-brand -mt-0.5" /> <strong className="text-white">Sur l'écran d'accueil</strong>
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand text-white text-xs font-semibold flex items-center justify-center">3</span>
                  <span className="text-sm text-text-secondary">
                    Appuyez sur <strong className="text-white">Ajouter</strong>
                  </span>
                </li>
              </ol>
              <p className="text-xs text-text-muted mt-4 text-center">
                L'app s'ouvrira ensuite directement depuis votre écran d'accueil
              </p>
            </>
          ) : (
            /* Android fallback (Firefox, Samsung Internet, etc.) */
            <>
              <ol className="space-y-4">
                <li className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand text-white text-xs font-semibold flex items-center justify-center">1</span>
                  <span className="text-sm text-text-secondary">
                    Appuyez sur <MoreVertical size={16} className="inline text-brand -mt-0.5" /> le menu du navigateur (en haut à droite)
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand text-white text-xs font-semibold flex items-center justify-center">2</span>
                  <span className="text-sm text-text-secondary">
                    Appuyez sur <strong className="text-white">Installer l'application</strong> ou <strong className="text-white">Ajouter à l'écran d'accueil</strong>
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand text-white text-xs font-semibold flex items-center justify-center">3</span>
                  <span className="text-sm text-text-secondary">
                    Confirmez en appuyant sur <strong className="text-white">Installer</strong>
                  </span>
                </li>
              </ol>
              <p className="text-xs text-text-muted mt-4 text-center">
                L'app s'ouvrira ensuite directement depuis votre écran d'accueil
              </p>
            </>
          )}
        </motion.div>
      )}

      {/* Banner (Android native + iOS/fallback trigger) */}
      {!showSteps && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 2 }}
          className="fixed bottom-20 inset-x-3 z-50 bg-bg-surface border border-white/[0.08] rounded-2xl p-4 shadow-xl shadow-black/40"
        >
          <div className="flex items-center gap-3">
            <img src="/pwa-192.png" alt="" className="w-11 h-11 rounded-xl" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Installer Monest</p>
              <p className="text-xs text-text-secondary truncate">Accès rapide depuis l'écran d'accueil</p>
            </div>
            {canPrompt ? (
              <button
                onClick={handleInstall}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand/90 transition-colors"
              >
                <Download size={15} />
                Installer
              </button>
            ) : (
              <button
                onClick={() => setShowSteps(true)}
                className="px-3.5 py-2 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand/90 transition-colors"
              >
                Comment ?
              </button>
            )}
            <button
              onClick={dismiss}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-text-muted"
              aria-label={t('common.close')}
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
