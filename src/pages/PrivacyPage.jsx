import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-8">
          <ArrowLeft size={16} /> Retour
        </Link>

        <h1 className="text-2xl font-bold mb-2">Politique de confidentialit&eacute;</h1>
        <p className="text-sm text-text-muted mb-8">Derni&egrave;re mise &agrave; jour : 11 mars 2026</p>

        <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">1. Introduction</h2>
            <p>
              Monest est une application de gestion de budget personnel. Nous prenons la protection de vos donn&eacute;es
              tr&egrave;s au s&eacute;rieux. Cette politique explique quelles donn&eacute;es nous collectons, comment nous les
              utilisons et vos droits.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">2. Donn&eacute;es collect&eacute;es</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-text-primary">Compte</strong> : adresse email et m&eacute;thode d&rsquo;authentification (mot de passe ou Google OAuth)</li>
              <li><strong className="text-text-primary">Donn&eacute;es budg&eacute;taires</strong> : revenus, charges, d&eacute;penses et objectifs d&rsquo;&eacute;pargne que vous saisissez</li>
              <li><strong className="text-text-primary">Pr&eacute;f&eacute;rences</strong> : langue, devise, configuration du foyer</li>
              <li><strong className="text-text-primary">Notifications push</strong> : jeton d&rsquo;abonnement Web Push (si activ&eacute;)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">3. Utilisation des donn&eacute;es</h2>
            <p>Vos donn&eacute;es sont utilis&eacute;es exclusivement pour :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Fournir le service de gestion de budget</li>
              <li>Synchroniser vos donn&eacute;es entre vos appareils</li>
              <li>Envoyer des notifications push (si vous les activez)</li>
              <li>Partager le budget avec votre partenaire (si vous l&rsquo;invitez)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">4. Pas de vente de donn&eacute;es</h2>
            <p>
              Nous ne vendons, ne louons et ne partageons <strong className="text-text-primary">jamais</strong> vos donn&eacute;es
              personnelles ou financi&egrave;res avec des tiers. Aucune publicit&eacute; ne sera affich&eacute;e dans
              l&rsquo;application.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">5. H&eacute;bergement et s&eacute;curit&eacute;</h2>
            <p>
              Les donn&eacute;es sont stock&eacute;es de mani&egrave;re s&eacute;curis&eacute;e sur des serveurs en Europe (EU West).
              L&rsquo;acc&egrave;s aux donn&eacute;es est prot&eacute;g&eacute; par une authentification et des
              politiques de s&eacute;curit&eacute; au niveau des lignes (RLS). Toutes les communications sont chiffr&eacute;es via HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">6. Vos droits</h2>
            <p>Conform&eacute;ment au RGPD, vous pouvez &agrave; tout moment :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Acc&eacute;der &agrave; vos donn&eacute;es (export disponible dans R&eacute;glages)</li>
              <li>Modifier vos informations personnelles</li>
              <li>Supprimer votre compte et toutes vos donn&eacute;es</li>
              <li>D&eacute;sactiver les notifications push</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">7. Cookies</h2>
            <p>
              Monest n&rsquo;utilise aucun cookie publicitaire ou de tracking. Seul le stockage local du navigateur
              (localStorage) est utilis&eacute; pour vos pr&eacute;f&eacute;rences et la mise en cache hors ligne.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">8. Contact</h2>
            <p>
              Pour toute question concernant vos donn&eacute;es personnelles :{' '}
              <a href="mailto:limlahi.fawsy3@gmail.com" className="text-brand hover:underline">
                limlahi.fawsy3@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
