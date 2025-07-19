import React from 'react';

const Privacy: React.FC = () => {
  return (
    <>
      {/* Blue curved header section */}
      <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Politique de confidentialité</h1>
          <p className="text-xl opacity-90">Protection des données personnelles et respect de votre vie privée</p>
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" 
             style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}}></div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Privacy Policy Section */}
        <section id="privacy-policy" className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-srh-blue mb-4">Notre engagement pour vos données</h2>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto">
              Le Syndicat des Radiologues Hospitaliers s'engage à protéger vos données personnelles 
              et à respecter le Règlement Général sur la Protection des Données (RGPD).
            </p>
          </div>
          
          <div className="space-y-6">
            {/* Section I - Objectif */}
            <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-srh-blue">
              <h3 className="text-lg font-semibold text-srh-blue mb-3">I. Objectif</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Cette politique de confidentialité a pour objectif de :
                <br/>
                • Protéger vos données personnelles
                <br/>
                • Assurer notre conformité au RGPD (Règlement UE 2016/679)
                <br/>
                • Garantir la sécurité et la confidentialité de vos informations
              </p>
            </div>

            {/* Section II - Champ d'application */}
            <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
              <h3 className="text-lg font-semibold text-green-700 mb-3">II. Champ d'application</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Cette politique s'applique à :
                <br/>
                • Toutes les demandes de contact via le site srh-info.org
                <br/>
                • Les formulaires d'adhésion au syndicat
                <br/>
                • Les informations transparentes concernant le traitement de vos données
              </p>
            </div>

            {/* Section III - Traitement des données */}
            <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
              <h3 className="text-lg font-semibold text-orange-700 mb-3">III. Traitement des données personnelles</h3>
              
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">1. Données collectées :</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  • Informations d'identification (nom, titre)
                  <br/>
                  • Coordonnées (email, téléphone)
                  <br/>
                  • Statut professionnel
                  <br/>
                  • Affiliations organisationnelles
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">2. Destinataires des données :</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  • Personnel du SRH
                  <br/>
                  • Fournisseur du site web
                  <br/>
                  • Scroll Agency
                  <br/>
                  • Hébergement AWS
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">3. Durée de conservation :</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  • Données d'adhésion : 5 ans
                  <br/>
                  • Demandes de contact : 3 ans
                </p>
              </div>
            </div>

            {/* Section IV - Vos droits */}
            <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
              <h3 className="text-lg font-semibold text-purple-700 mb-3">IV. Vos droits</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Conformément au RGPD, vous disposez des droits suivants :
                <br/>
                • <strong>Droit d'accès</strong> : consulter vos données personnelles
                <br/>
                • <strong>Droit de rectification</strong> : corriger vos données
                <br/>
                • <strong>Droit à l'effacement</strong> : supprimer vos données
                <br/>
                • <strong>Droit à la limitation du traitement</strong> : restreindre l'utilisation de vos données
                <br/>
                • <strong>Droit à la portabilité</strong> : récupérer vos données dans un format structuré
                <br/>
                • <strong>Droit d'opposition</strong> : vous opposer au traitement de vos données
              </p>
            </div>

            {/* Section V - Cookies */}
            <div className="bg-indigo-50 p-6 rounded-lg border-l-4 border-indigo-500">
              <h3 className="text-lg font-semibold text-indigo-700 mb-3">V. Politique des cookies</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Notre site utilise deux types de cookies :
                <br/><br/>
                <strong>Cookies essentiels :</strong>
                <br/>
                • Nécessaires au fonctionnement du site
                <br/>
                • Aucun consentement requis
                <br/><br/>
                <strong>Cookies marketing/personnalisation :</strong>
                <br/>
                • Amélioration de votre expérience utilisateur
                <br/>
                • Consentement requis
              </p>
            </div>

            {/* Section VI - Contact */}
            <div className="bg-teal-50 p-6 rounded-lg border-l-4 border-teal-500">
              <h3 className="text-lg font-semibold text-teal-700 mb-3">VI. Contact pour vos données</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Pour toute question concernant vos données personnelles ou pour exercer vos droits, 
                vous pouvez nous contacter à l'adresse suivante :
                <br/><br/>
                <strong>Email :</strong> contact@srh-info.com
                <br/>
                <strong>Adresse :</strong> 15 rue Ferdinand Duval, 75004 Paris
              </p>
            </div>

            {/* Section VII - Mise à jour */}
            <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
              <h3 className="text-lg font-semibold text-yellow-700 mb-3">VII. Mise à jour de cette politique</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Cette politique de confidentialité peut être mise à jour périodiquement 
                pour refléter les changements dans nos pratiques de traitement des données 
                ou les évolutions réglementaires. Nous vous encourageons à consulter 
                régulièrement cette page pour rester informé.
              </p>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="mt-12 bg-gray-100 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Information légale</h3>
            <p className="text-gray-700 text-sm">
              Cette politique de confidentialité est conforme au Règlement Général sur la Protection des Données (RGPD) 
              en vigueur depuis le 25 mai 2018. Pour toute réclamation concernant le traitement de vos données, 
              vous pouvez saisir la Commission Nationale de l'Informatique et des Libertés (CNIL).
            </p>
          </div>
        </section>
      </div>
    </>
  );
};

export default Privacy;