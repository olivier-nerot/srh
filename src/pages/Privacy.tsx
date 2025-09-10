import React from 'react';

const Privacy: React.FC = () => {
  return (
    <>
      {/* Blue curved header section */}
      <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Politique de confidentialité</h1>
            <p className="text-xl opacity-90">Protection des données personnelles</p>
          </div>
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" 
             style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}}></div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">I - Objectif de la Charte</h2>
            <div className="space-y-4 text-gray-700">
              <p>Le site web du SRH privilégie la protection des données personnelles.</p>
              <p>Il respecte le Règlement Général sur la Protection des Données (RGPD) européen.</p>
              <p>Il garantit les principes fondamentaux de protection des données :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Application des principes de proportionnalité et de pertinence des données</li>
                <li>Garantie de la sécurité et de la confidentialité des données</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">II - Champ d'application</h2>
            <div className="space-y-4 text-gray-700">
              <p>Définition des termes : SRH désigné par "nous/notre", utilisateurs désignés par "vous/votre".</p>
              <p>Fournit des informations transparentes sur le traitement des données personnelles :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Nature des données collectées</li>
                <li>Finalités d'utilisation et de partage des données</li>
                <li>Durée de conservation des données</li>
                <li>Droits des utilisateurs</li>
              </ul>
              <p>Couvre les demandes de contact et formulaires d'adhésion sur <a href="https://www.srh-info.org" className="text-blue-600 hover:text-blue-700 underline">https://www.srh-info.org</a></p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">III - Traitements mis en œuvre</h2>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Données personnelles collectées</h3>
              <div className="space-y-4 text-gray-700">
                <p>Informations d'identification :</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Nom, prénom, civilité</li>
                </ul>
                <p>Coordonnées :</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Email, téléphone</li>
                </ul>
                <p>Situation professionnelle :</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Nom de l'hôpital, statut professionnel</li>
                </ul>
                <p>Autres affiliations organisationnelles</p>
                <p><strong>Collecte des données basée sur le consentement de l'utilisateur</strong></p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Destinataires des données</h3>
              <div className="space-y-4 text-gray-700">
                <p>Les données ne sont pas transférées vers d'autres pays.</p>
                <p>Accessibles aux :</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Collaborateurs du SRH</li>
                  <li>Fournisseur du site web</li>
                  <li>Scroll Agency</li>
                  <li>AWS (Amazon Web Services)</li>
                </ul>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Durée de conservation des données</h3>
              <div className="space-y-4 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Données d'adhésion : 5 ans après la demande</li>
                  <li>Données de demande de contact : 3 ans après le dernier contact</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">IV - Exercice des droits</h2>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Droits des utilisateurs</h3>
              <div className="space-y-4 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Droit d'accès</li>
                  <li>Droit de rectification</li>
                  <li>Droit à l'effacement</li>
                  <li>Droit de limitation du traitement</li>
                  <li>Droit à la portabilité des données</li>
                  <li>Droit d'opposition</li>
                </ul>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Comment exercer vos droits</h3>
              <div className="space-y-4 text-gray-700">
                <p>Envoyez un courrier à l'adresse du SRH ou un email à <a href="mailto:contact@srh-info.com" className="text-blue-600 hover:text-blue-700 underline">contact@srh-info.com</a></p>
                <p>Possibilité de réclamation auprès de la CNIL</p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">V - Gestion des cookies</h2>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Définition des cookies</h3>
              <div className="space-y-4 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Petits fichiers stockés sur l'appareil de l'utilisateur</li>
                  <li>Permettent le fonctionnement du site</li>
                  <li>Fournissent des informations statistiques/marketing</li>
                </ul>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Types de cookies</h3>
              <div className="space-y-4 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Cookies essentiels</li>
                  <li>Cookies marketing</li>
                  <li>Cookies de personnalisation</li>
                  <li>Cookies de mesure</li>
                </ul>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Modification des préférences de cookies</h3>
              <div className="space-y-4 text-gray-700">
                <p>Vous pouvez modifier vos préférences de cookies à tout moment via les paramètres de votre navigateur.</p>
              </div>
            </div>
          </section>

          <section className="mb-12 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="space-y-4 text-gray-700">
              <p><strong>Mise à jour :</strong> 06/10/2022</p>
              <p><strong>Contact :</strong> <a href="mailto:contact@srh-info.com" className="text-blue-600 hover:text-blue-700 underline">contact@srh-info.com</a></p>
            </div>
          </section>

        </div>
      </div>
    </>
  );
};

export default Privacy;