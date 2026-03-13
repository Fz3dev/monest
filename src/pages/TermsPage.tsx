import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary safe-area-top">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-8">
          <ArrowLeft size={16} /> Retour
        </Link>

        <h1 className="text-2xl font-bold mb-2">Conditions d&rsquo;utilisation</h1>
        <p className="text-sm text-text-muted mb-8">Derni&egrave;re mise &agrave; jour : 11 mars 2026</p>

        <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">1. Acceptation</h2>
            <p>
              En utilisant Monest, vous acceptez les pr&eacute;sentes conditions d&rsquo;utilisation.
              Si vous n&rsquo;&ecirc;tes pas d&rsquo;accord, veuillez ne pas utiliser l&rsquo;application.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">2. Description du service</h2>
            <p>
              Monest est une application gratuite de gestion de budget personnel. Elle permet de suivre
              ses revenus, charges fixes, d&eacute;penses et objectifs d&rsquo;&eacute;pargne, en solo ou en couple.
              L&rsquo;application est fournie en l&rsquo;&eacute;tat, sans garantie de disponibilit&eacute; permanente.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">3. Compte utilisateur</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Vous &ecirc;tes responsable de la s&eacute;curit&eacute; de votre compte</li>
              <li>Vous devez fournir une adresse email valide</li>
              <li>Un seul compte par personne</li>
              <li>Vous pouvez supprimer votre compte &agrave; tout moment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">4. Utilisation acceptable</h2>
            <p>Vous vous engagez &agrave; :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Utiliser le service uniquement &agrave; des fins personnelles de gestion budg&eacute;taire</li>
              <li>Ne pas tenter d&rsquo;acc&eacute;der aux donn&eacute;es d&rsquo;autres utilisateurs</li>
              <li>Ne pas perturber le fonctionnement du service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">5. Donn&eacute;es et vie priv&eacute;e</h2>
            <p>
              Vos donn&eacute;es budg&eacute;taires vous appartiennent. Nous ne les utilisons que pour fournir le service.
              Consultez notre{' '}
              <Link to="/confidentialite" className="text-brand hover:underline">
                politique de confidentialit&eacute;
              </Link>{' '}
              pour plus de d&eacute;tails.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">6. Gratuit&eacute;</h2>
            <p>
              Monest est gratuit et le restera. Aucun abonnement, aucun achat in-app, aucune publicit&eacute;.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">7. Limitation de responsabilit&eacute;</h2>
            <p>
              Monest est un outil d&rsquo;aide &agrave; la gestion budg&eacute;taire et ne constitue en aucun cas un
              conseil financier. Nous ne sommes pas responsables des d&eacute;cisions financi&egrave;res prises
              sur la base des informations affich&eacute;es dans l&rsquo;application.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">8. Modifications</h2>
            <p>
              Nous nous r&eacute;servons le droit de modifier ces conditions. Les utilisateurs seront inform&eacute;s
              des changements importants.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">9. Contact</h2>
            <p>
              Pour toute question :{' '}
              <a href="mailto:contact@monest.dev" className="text-brand hover:underline">
                contact@monest.dev
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
