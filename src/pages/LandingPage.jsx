import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowRight, Shield, Smartphone, Users, PiggyBank, BarChart3, Zap,
  Lock, Eye, EyeOff, TrendingUp, Wallet, ChevronRight, Star,
  CreditCard, ShoppingBag, Globe,
} from 'lucide-react'

// ─── Bilingual content ───────────────────────────────────────────────────────

const CONTENT = {
  fr: {
    nav: { features: 'Fonctionnalités', login: 'Connexion', cta: 'Commencer' },
    hero: {
      badge: 'Gratuit pour toujours — aucune carte requise',
      title: 'Sachez exactement où',
      titleGradient: 'passe chaque euro',
      subtitle: 'Un outil de budget moderne conçu pour ceux qui veulent de la clarté, pas de la complexité. Suivez vos dépenses, partagez les charges avec votre partenaire et construisez de vraies habitudes d\'épargne.',
      cta: 'Commencer gratuitement',
      secondary: 'Voir comment ça marche',
      badges: ['Privé', 'Hors ligne', 'Tout appareil'],
    },
    stats: [
      { value: '100%', label: 'Privé et sécurisé' },
      { value: '0€', label: 'Gratuit pour toujours' },
      { value: '<2 min', label: 'Temps de config' },
      { value: 'PWA', label: 'Fonctionne hors ligne' },
    ],
    problem: {
      label: 'Le problème',
      title: 'Gérer son argent ne devrait pas être aussi compliqué',
      subtitle: 'Les tableurs sont fastidieux. Les apps bancaires sont confuses. La plupart des outils de budget ressemblent à des devoirs. Vous méritez mieux.',
      pains: [
        'Aucune idée de où passe l\'argent chaque mois',
        'Surpris par les factures et les charges imprévues',
        'Envie d\'épargner mais impossible de garder l\'habitude',
      ],
    },
    features: {
      label: 'Fonctionnalités',
      title: 'Tout ce qu\'il faut. Rien de superflu.',
      subtitle: 'Des outils simples et puissants pour comprendre et maîtriser votre argent.',
      items: [
        { title: 'Dashboard intelligent', description: 'Voyez votre budget restant en un coup d\'œil. Sachez exactement ce que vous pouvez dépenser, chaque jour.' },
        { title: 'Finances partagées', description: 'Gérez un budget à deux avec des modes de répartition flexibles — égal, pourcentage ou au prorata des revenus.' },
        { title: 'Objectifs d\'épargne', description: 'Fixez des objectifs, suivez votre progression et regardez votre épargne grandir avec des jalons visuels.' },
        { title: 'Ajout rapide', description: 'Ajoutez une dépense en quelques secondes avec des catégories en un tap. Glissez pour supprimer, tapez pour modifier.' },
        { title: 'Partout, tout le temps', description: 'Installez-la comme une app sur n\'importe quel appareil. Fonctionne hors ligne et se synchronise automatiquement.' },
        { title: 'Vie privée d\'abord', description: 'Aucune connexion bancaire requise. Aucun partage de données. Vos finances restent privées.' },
      ],
    },
    howItWorks: {
      label: 'Comment ça marche',
      title: 'Opérationnel en moins de 2 minutes',
      subtitle: 'Pas de configuration complexe. Pas de credentials bancaires. Juste votre budget.',
      steps: [
        { title: 'Créez votre compte', description: 'Inscription en 30 secondes. Choisissez le mode solo ou partagé.' },
        { title: 'Ajoutez vos charges', description: 'Saisissez vos charges fixes — loyer, abonnements, factures. Ou importez un CSV.' },
        { title: 'Suivez et épargnez', description: 'Enregistrez vos dépenses en déplacement. Voyez votre vrai budget restant.' },
      ],
    },
    security: {
      label: 'Sécurité et confidentialité',
      title: 'Vos données restent les vôtres.',
      titleGradient: 'Point final.',
      subtitle: 'Monest est conçu avec la vie privée au cœur. Aucune connexion bancaire, aucun tracking, aucune revente de données. Vos informations financières ne quittent jamais votre contrôle.',
      items: [
        'Chiffrement de bout en bout avec Supabase',
        'Nous ne vendons ni ne partageons vos données',
        'Aucune information bancaire requise',
        'Conforme RGPD — hébergé en Europe',
      ],
      bigText: '256-bit',
      bigSubtext: 'Chiffrement AES',
    },
    cta: {
      title: 'Prêt à reprendre le contrôle de',
      titleGradient: 'votre argent ?',
      subtitle: 'Rejoignez ceux qui comprennent enfin leur budget. Pas de carte. Pas de piège. Pas de stress.',
      button: 'Commencer — c\'est gratuit',
      stars: 'Adopté par les budgeteurs',
    },
    footer: { rights: 'Tous droits réservés.' },
    mockup: {
      remaining: 'Reste à dépenser',
      spent: 'dépensé',
      budget: 'budget',
      savings: 'Épargne',
      charges: 'Charges',
      today: 'Aujourd\'hui',
      expenses: [
        { emoji: '🛒', name: 'Courses', amount: '47,20' },
        { emoji: '⛽', name: 'Essence', amount: '62,00' },
        { emoji: '🍽️', name: 'Restaurant', amount: '34,50' },
      ],
      nav: ['Accueil', 'Dépenses', 'Charges', 'Épargne', 'Réglages'],
    },
    langSwitch: { label: 'English', path: '/en' },
  },
  en: {
    nav: { features: 'Features', login: 'Log in', cta: 'Get started' },
    hero: {
      badge: 'Free forever — no credit card needed',
      title: 'Know exactly where',
      titleGradient: 'every euro goes',
      subtitle: 'A modern budget tracker designed for people who want clarity, not complexity. Track spending, split expenses with your partner, and build real savings habits.',
      cta: 'Start for free',
      secondary: 'See how it works',
      badges: ['Private', 'Offline', 'Any device'],
    },
    stats: [
      { value: '100%', label: 'Private & secure' },
      { value: '0€', label: 'Free forever' },
      { value: '<2 min', label: 'Setup time' },
      { value: 'PWA', label: 'Works offline' },
    ],
    problem: {
      label: 'The problem',
      title: 'Managing money shouldn\'t feel this hard',
      subtitle: 'Spreadsheets are tedious. Banking apps are confusing. Most budget tools feel like homework. You deserve something that works with you, not against you.',
      pains: [
        'No idea where money goes each month',
        'Surprised by bills and unexpected charges',
        'Want to save but can\'t build the habit',
      ],
    },
    features: {
      label: 'Features',
      title: 'Everything you need. Nothing you don\'t.',
      subtitle: 'Simple, powerful tools that help you understand and control your money.',
      items: [
        { title: 'Smart dashboard', description: 'See your remaining budget at a glance. Know exactly what you can spend, every single day.' },
        { title: 'Shared finances', description: 'Manage budgets as a couple with flexible split modes — equal, percentage, or income-based.' },
        { title: 'Savings goals', description: 'Set targets, track progress, and watch your savings grow with visual milestones.' },
        { title: 'Quick expense entry', description: 'Add expenses in seconds with one-tap categories. Swipe to delete, tap to edit.' },
        { title: 'Works everywhere', description: 'Install as an app on any device. Works offline and syncs when you\'re back online.' },
        { title: 'Privacy first', description: 'No bank connection required. No third-party data sharing. Your finances stay private.' },
      ],
    },
    howItWorks: {
      label: 'How it works',
      title: 'Up and running in under 2 minutes',
      subtitle: 'No complicated setup. No bank credentials. Just your budget.',
      steps: [
        { title: 'Create your account', description: 'Sign up in 30 seconds. Choose solo or shared mode.' },
        { title: 'Set your charges', description: 'Add fixed expenses — rent, subscriptions, bills. Or import from CSV.' },
        { title: 'Track & grow', description: 'Log expenses on the go. See your real remaining budget and build savings.' },
      ],
    },
    security: {
      label: 'Security & privacy',
      title: 'Your data stays yours.',
      titleGradient: 'Period.',
      subtitle: 'We built Monest with privacy at its core. No bank connection, no tracking, no data selling. Your financial information never leaves your control.',
      items: [
        'End-to-end encryption with Supabase',
        'We never sell or share your data',
        'No bank credentials required',
        'GDPR compliant — EU hosted',
      ],
      bigText: '256-bit',
      bigSubtext: 'AES encryption',
    },
    cta: {
      title: 'Ready to take control of',
      titleGradient: 'your money?',
      subtitle: 'Join people who finally understand their budget. No credit card. No strings. No stress.',
      button: 'Get started — it\'s free',
      stars: 'Loved by budgeters',
    },
    footer: { rights: 'All rights reserved.' },
    mockup: {
      remaining: 'Remaining to spend',
      spent: 'spent',
      budget: 'budget',
      savings: 'Savings',
      charges: 'Charges',
      today: 'Today',
      expenses: [
        { emoji: '🛒', name: 'Groceries', amount: '47.20' },
        { emoji: '⛽', name: 'Fuel', amount: '62.00' },
        { emoji: '🍽️', name: 'Restaurant', amount: '34.50' },
      ],
      nav: ['Home', 'Expenses', 'Charges', 'Savings', 'Settings'],
    },
    langSwitch: { label: 'Français', path: '/' },
  },
}

// ─── Animation variants ──────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

// ─── Fake Dashboard Mockup ───────────────────────────────────────────────────

function DashboardMockup({ t }) {
  const m = t.mockup
  return (
    <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[380px]">
      <div className="relative bg-[#0F0F15] rounded-[2.5rem] border border-white/[0.1] p-3 shadow-2xl shadow-brand/10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#0F0F15] rounded-b-2xl z-10" />
        <div className="bg-bg-primary rounded-[2rem] overflow-hidden">
          {/* Status bar */}
          <div className="flex justify-between items-center px-6 pt-4 pb-2">
            <span className="text-[10px] text-text-muted font-medium">9:41</span>
            <div className="flex gap-1">
              <div className="w-3 h-1.5 rounded-sm bg-text-muted/40" />
              <div className="w-3 h-1.5 rounded-sm bg-text-muted/40" />
              <div className="w-4 h-2 rounded-sm bg-success/60 border border-success/30" />
            </div>
          </div>
          {/* Header */}
          <div className="px-5 pt-2 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-brand/20" />
                <span className="text-xs font-bold text-text-primary">Monest</span>
              </div>
              <div className="w-6 h-6 rounded-full bg-white/[0.06]" />
            </div>
          </div>
          {/* Remaining budget */}
          <div className="px-4 pb-3">
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{m.remaining}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-success">1 247</span>
                <span className="text-lg text-success/60">€</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-success"
                  initial={{ width: 0 }}
                  whileInView={{ width: '62%' }}
                  transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                  viewport={{ once: true }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[9px] text-text-muted">38% {m.spent}</span>
                <span className="text-[9px] text-text-muted">€2 040 {m.budget}</span>
              </div>
            </div>
          </div>
          {/* Quick stats */}
          <div className="px-4 pb-3 grid grid-cols-2 gap-2">
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp size={10} className="text-success" />
                <span className="text-[9px] text-text-muted">{m.savings}</span>
              </div>
              <span className="text-sm font-bold text-text-primary">€4 200</span>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <CreditCard size={10} className="text-brand" />
                <span className="text-[9px] text-text-muted">{m.charges}</span>
              </div>
              <span className="text-sm font-bold text-text-primary">€793</span>
            </div>
          </div>
          {/* Recent expenses */}
          <div className="px-4 pb-4">
            <p className="text-[10px] font-semibold text-text-secondary mb-2">{m.today}</p>
            {m.expenses.map((item) => (
              <div key={item.name} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-white/[0.04]">
                  {item.emoji}
                </div>
                <span className="flex-1 text-xs text-text-primary">{item.name}</span>
                <span className="text-xs font-medium text-danger">-€{item.amount}</span>
              </div>
            ))}
          </div>
          {/* Bottom nav */}
          <div className="border-t border-white/[0.06] px-4 py-2.5 flex justify-around">
            {m.nav.map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <div className={`w-4 h-4 rounded ${i === 0 ? 'bg-brand/30' : 'bg-white/[0.06]'}`} />
                <span className={`text-[7px] ${i === 0 ? 'text-brand' : 'text-text-muted'}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -inset-20 -z-10 opacity-40 blur-3xl bg-gradient-to-b from-brand/20 via-brand/5 to-transparent rounded-full" />
    </div>
  )
}

// ─── Feature icons (indexed by position) ─────────────────────────────────────

const FEATURE_ICONS = [BarChart3, Users, PiggyBank, Zap, Smartphone, Shield]
const FEATURE_COLORS = ['#6C63FF', '#818CF8', '#4ADE80', '#FBBF24', '#38BDF8', '#F87171']
const STEP_ICONS = [Wallet, CreditCard, TrendingUp]
const PAIN_ICONS = [EyeOff, CreditCard, TrendingUp]
const SECURITY_ICONS = [Lock, Eye, Shield, Globe]
const STAT_ICONS = [Lock, ShoppingBag, Zap, Smartphone]

// ─── Main Landing Page ───────────────────────────────────────────────────────

export default function LandingPage({ lang = 'fr' }) {
  const t = CONTENT[lang] || CONTENT.fr

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-x-hidden">
      {/* Ambient gradient orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-brand/[0.07] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-light/[0.05] blur-[100px]" />
      </div>

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/70 backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo-crown-sm.webp" alt="Monest" className="w-7 h-7" />
            <span className="text-lg font-bold tracking-tight">Monest</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="#features" className="hidden sm:block px-3 py-2 text-sm text-text-muted hover:text-white transition-colors">
              {t.nav.features}
            </a>
            <Link to={t.langSwitch.path} className="px-3 py-2 text-sm text-text-muted hover:text-white transition-colors">
              {t.langSwitch.label}
            </Link>
            <Link to="/login" className="hidden sm:block px-4 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors">
              {t.nav.login}
            </Link>
            <Link to="/signup" className="px-5 py-2.5 text-sm font-semibold bg-brand hover:bg-brand-dark text-white rounded-xl transition-all shadow-lg shadow-brand/20 hover:shadow-brand/30">
              {t.nav.cta}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center lg:text-left">
              <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-sm font-medium mb-6">
                <Zap size={14} />
                <span>{t.hero.badge}</span>
              </motion.div>
              <motion.h1 variants={fadeUp} transition={{ duration: 0.6 }} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight mb-6">
                {t.hero.title}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-brand-light to-success">
                  {t.hero.titleGradient}
                </span>
              </motion.h1>
              <motion.p variants={fadeUp} transition={{ duration: 0.6 }} className="text-lg text-text-secondary max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                {t.hero.subtitle}
              </motion.p>
              <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link to="/signup" className="group flex items-center gap-2 px-8 py-4 text-base font-semibold bg-brand hover:bg-brand-dark text-white rounded-2xl transition-all shadow-xl shadow-brand/25 hover:shadow-brand/40 hover:scale-[1.02]">
                  {t.hero.cta}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#how-it-works" className="flex items-center gap-2 px-6 py-4 text-base font-medium text-text-secondary hover:text-white transition-colors">
                  {t.hero.secondary}
                  <ChevronRight size={16} />
                </a>
              </motion.div>
              <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="mt-6 text-sm text-text-muted flex items-center justify-center lg:justify-start gap-4">
                <span className="flex items-center gap-1"><Shield size={12} /> {t.hero.badges[0]}</span>
                <span className="flex items-center gap-1"><Globe size={12} /> {t.hero.badges[1]}</span>
                <span className="flex items-center gap-1"><Smartphone size={12} /> {t.hero.badges[2]}</span>
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className="flex justify-center lg:justify-end"
            >
              <DashboardMockup t={t} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Social proof ── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={stagger}
        className="py-12 border-y border-white/[0.06] bg-white/[0.01]"
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14">
            {t.stats.map((stat, i) => {
              const Icon = STAT_ICONS[i]
              return (
                <motion.div key={stat.label} variants={fadeUp} transition={{ duration: 0.4 }} className="text-center flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <Icon size={16} className="text-brand" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold text-text-primary">{stat.value}</div>
                    <div className="text-xs text-text-muted">{stat.label}</div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.section>

      {/* ── Problem statement ── */}
      <section className="py-20 sm:py-28 px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger} className="max-w-3xl mx-auto text-center">
          <motion.p variants={fadeUp} className="text-sm font-medium text-brand uppercase tracking-widest mb-4">{t.problem.label}</motion.p>
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="text-3xl sm:text-4xl font-bold mb-6">{t.problem.title}</motion.h2>
          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-lg text-text-secondary leading-relaxed mb-10">{t.problem.subtitle}</motion.p>
          <motion.div variants={stagger} className="grid sm:grid-cols-3 gap-4">
            {t.problem.pains.map((pain, i) => {
              const Icon = PAIN_ICONS[i]
              return (
                <motion.div key={i} variants={fadeUp} transition={{ duration: 0.4 }} className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center">
                    <Icon size={18} className="text-danger/70" />
                  </div>
                  <p className="text-sm text-text-secondary text-center leading-relaxed">{pain}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 sm:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger} className="text-center mb-14">
            <motion.p variants={fadeUp} className="text-sm font-medium text-brand uppercase tracking-widest mb-4">{t.features.label}</motion.p>
            <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="text-3xl sm:text-4xl font-bold mb-4">{t.features.title}</motion.h2>
            <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-text-secondary text-lg max-w-2xl mx-auto">{t.features.subtitle}</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {t.features.items.map((feature, i) => {
              const Icon = FEATURE_ICONS[i]
              const color = FEATURE_COLORS[i]
              return (
                <motion.div key={i} variants={fadeUp} transition={{ duration: 0.4 }} className="group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300" style={{ backgroundColor: `${color}12` }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-20 sm:py-28 px-6 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger} className="text-center mb-14">
            <motion.p variants={fadeUp} className="text-sm font-medium text-brand uppercase tracking-widest mb-4">{t.howItWorks.label}</motion.p>
            <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="text-3xl sm:text-4xl font-bold mb-4">{t.howItWorks.title}</motion.h2>
            <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-text-secondary text-lg">{t.howItWorks.subtitle}</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={stagger} className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {t.howItWorks.steps.map((item, i) => {
              const Icon = STEP_ICONS[i]
              return (
                <motion.div key={i} variants={fadeUp} transition={{ duration: 0.4 }} className="text-center relative">
                  <div className="relative inline-block mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto">
                      <Icon size={24} className="text-brand" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-brand/30">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{item.description}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Security & Trust ── */}
      <section className="py-20 sm:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger} className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
              <p className="text-sm font-medium text-brand uppercase tracking-widest mb-4">{t.security.label}</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                {t.security.title}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-light">
                  {t.security.titleGradient}
                </span>
              </h2>
              <p className="text-text-secondary text-lg leading-relaxed mb-8">{t.security.subtitle}</p>
              <div className="space-y-4">
                {t.security.items.map((text, i) => {
                  const Icon = SECURITY_ICONS[i]
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                        <Icon size={14} className="text-success" />
                      </div>
                      <span className="text-sm text-text-secondary">{text}</span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
            <motion.div variants={fadeUp} transition={{ duration: 0.6, delay: 0.2 }} className="flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl bg-gradient-to-br from-brand/10 via-white/[0.03] to-success/10 border border-white/[0.08] flex items-center justify-center">
                  <div className="text-center">
                    <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                      <Shield size={64} className="text-brand/40 mx-auto mb-4" strokeWidth={1} />
                    </motion.div>
                    <p className="text-2xl font-bold text-text-primary mb-1">{t.security.bigText}</p>
                    <p className="text-sm text-text-muted">{t.security.bigSubtext}</p>
                  </div>
                </div>
                <div className="absolute -inset-10 -z-10 opacity-30 blur-3xl bg-gradient-to-br from-brand/20 to-success/20 rounded-full" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 sm:py-28 px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger} className="max-w-3xl mx-auto text-center">
          <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            {t.cta.title}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-success">
              {t.cta.titleGradient}
            </span>
          </motion.h2>
          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-text-secondary text-lg mb-10 max-w-xl mx-auto">{t.cta.subtitle}</motion.p>
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <Link to="/signup" className="group inline-flex items-center gap-2 px-10 py-5 text-lg font-semibold bg-brand hover:bg-brand-dark text-white rounded-2xl transition-all shadow-xl shadow-brand/25 hover:shadow-brand/40 hover:scale-[1.02]">
              {t.cta.button}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
          <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="mt-6 flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} className="text-warning fill-warning" />
            ))}
            <span className="text-sm text-text-muted ml-2">{t.cta.stars}</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo-crown-sm.webp" alt="Monest" className="w-5 h-5 opacity-50" />
            <span className="text-sm text-text-muted">© {new Date().getFullYear()} Monest. {t.footer.rights}</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/Fz3dev/monest" target="_blank" rel="noopener noreferrer" className="text-sm text-text-muted hover:text-text-secondary transition-colors">
              GitHub
            </a>
            <Link to="/login" className="text-sm text-text-muted hover:text-text-secondary transition-colors">
              {t.nav.login}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
