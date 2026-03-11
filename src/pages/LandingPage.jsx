import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Smartphone, Users, PiggyBank, BarChart3, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo-crown-sm.webp" alt="Monest" className="w-7 h-7" />
            <span className="text-lg font-bold tracking-tight">Monest</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2.5 text-sm font-semibold bg-brand hover:bg-brand-dark text-white rounded-xl transition-all shadow-lg shadow-brand/20"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-sm font-medium mb-8">
            <Zap size={14} />
            <span>Free forever — no credit card required</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6">
            Your budget,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-light">
              crystal clear
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Track expenses, manage shared finances, and build savings — all in one beautifully simple app. No bank connection needed. Your data stays yours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="group flex items-center gap-2 px-8 py-4 text-base font-semibold bg-brand hover:bg-brand-dark text-white rounded-2xl transition-all shadow-xl shadow-brand/25 hover:shadow-brand/40"
            >
              Start for free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="px-8 py-4 text-base font-medium text-text-secondary hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-2xl border border-white/[0.08] transition-all"
            >
              See how it works
            </a>
          </div>
          <p className="mt-6 text-sm text-text-muted">
            Works on any device — install as an app from your browser
          </p>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-12 border-y border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm text-text-muted mb-6 uppercase tracking-widest font-medium">Trusted by smart budgeters</p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-text-primary">100%</div>
              <div className="text-xs text-text-muted mt-1">Private & secure</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-text-primary">0€</div>
              <div className="text-xs text-text-muted mt-1">Free forever</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-text-primary">PWA</div>
              <div className="text-xs text-text-muted mt-1">Works offline</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-text-primary">2 min</div>
              <div className="text-xs text-text-muted mt-1">Setup time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to take control</h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Simple tools that actually help you understand where your money goes.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BarChart3,
                title: 'Smart dashboard',
                description: 'See your remaining budget at a glance. Know exactly what you can spend, every day.',
              },
              {
                icon: Users,
                title: 'Shared finances',
                description: 'Manage budgets as a couple with flexible split modes — equal, percentage, or income-based.',
              },
              {
                icon: PiggyBank,
                title: 'Savings goals',
                description: 'Set targets, track progress, and watch your savings grow with visual milestones.',
              },
              {
                icon: Smartphone,
                title: 'Works everywhere',
                description: 'Install as an app on any device. Works offline — syncs when you\'re back online.',
              },
              {
                icon: Shield,
                title: 'Privacy first',
                description: 'No bank connection required. No third-party data sharing. Your finances stay private.',
              },
              {
                icon: Zap,
                title: 'Quick expense entry',
                description: 'Add expenses in seconds with one-tap categories and smart shortcuts.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl bg-bg-surface/60 border border-white/[0.06] hover:border-brand/20 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mb-4 group-hover:bg-brand/15 transition-colors">
                  <feature.icon size={22} className="text-brand" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-bg-surface/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Up and running in minutes</h2>
          <p className="text-text-secondary text-lg mb-16">No complicated setup. No bank credentials. Just your budget.</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create your account', description: 'Sign up in 30 seconds. Choose solo or shared mode.' },
              { step: '2', title: 'Set your charges', description: 'Add your fixed expenses — rent, subscriptions, bills.' },
              { step: '3', title: 'Track & save', description: 'Log expenses on the go. See your real remaining budget.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand/15 border-2 border-brand/30 flex items-center justify-center text-brand font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-text-secondary">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to take control of your money?</h2>
          <p className="text-text-secondary text-lg mb-8">
            Join thousands of people who finally understand their budget. Free, forever.
          </p>
          <Link
            to="/signup"
            className="group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold bg-brand hover:bg-brand-dark text-white rounded-2xl transition-all shadow-xl shadow-brand/25 hover:shadow-brand/40"
          >
            Get started — it's free
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo-crown-sm.webp" alt="Monest" className="w-5 h-5 opacity-50" />
            <span className="text-sm text-text-muted">© {new Date().getFullYear()} Monest. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/Fz3dev/monest" target="_blank" rel="noopener noreferrer" className="text-sm text-text-muted hover:text-text-secondary transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
