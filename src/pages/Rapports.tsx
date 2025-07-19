import React from 'react';
import { FileText, Download, Calendar } from 'lucide-react';

const Rapports: React.FC = () => {
  const rapportsInstitutionnels = [
    {
      title: "Rapport de la Cour des comptes sur la formation continue des médecins",
      description: "Recommandation de fusionner les systèmes de formation continue",
      date: "2024-01-01",
      organization: "Cour des comptes"
    },
    {
      title: "Rapport IGAS sur la continuité du service de soins",
      description: "Analyse de la continuité des services de santé",
      date: "2023-12-01",
      organization: "IGAS"
    },
    {
      title: "Rapport de la Cour des comptes sur l'imagerie médicale",
      description: "Évaluation des équipements et pratiques en imagerie médicale",
      date: "2022-11-01",
      organization: "Cour des comptes"
    },
    {
      title: "Propositions conjointes des ordres de santé sur l'accès territorial aux soins",
      description: "Propositions pour améliorer l'accès aux soins sur le territoire",
      date: "2022-10-01",
      organization: "Ordres professionnels"
    },
    {
      title: "Ordonnance sur la certification périodique des professionnels de santé",
      description: "Cadre réglementaire pour la certification des professionnels",
      date: "2021-12-01",
      organization: "Gouvernement"
    }
  ];

  return (
    <>
      {/* Blue curved header section */}
      <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Rapports institutionnels</h1>
          <p className="text-xl opacity-90">Études et analyses des organismes officiels</p>
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" 
             style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}}></div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center mb-8">
          <FileText className="h-8 w-8 text-green-600 mr-3" />
          <h2 className="text-3xl font-bold text-gray-900">Rapports institutionnels</h2>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-green-900 mb-2">À propos des rapports</h3>
          <p className="text-green-800">
            Les rapports institutionnels présentés ici émanent d'organismes officiels (Cour des comptes, IGAS, etc.) 
            et traitent de sujets importants pour l'exercice de la radiologie hospitalière.
          </p>
        </div>

        <div className="space-y-6">
          {rapportsInstitutionnels.map((rapport, index) => (
            <article key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {rapport.organization}
                </span>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(rapport.date).toLocaleDateString('fr-FR')}
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {rapport.title}
              </h3>
              
              <p className="text-gray-700 mb-4">
                {rapport.description}
              </p>
              
              <div className="flex items-center justify-between">
                <button className="text-green-600 hover:text-green-700 font-medium text-sm">
                  Consulter le rapport
                </button>
                <Download className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
              </div>
            </article>
          ))}
        </div>

        {/* Search and Filter */}
        <section className="bg-gray-50 rounded-lg p-8 mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Rechercher dans les rapports</h2>
          <p className="text-gray-700 mb-6">
            Utilisez les filtres ci-dessous pour trouver rapidement les rapports qui vous intéressent.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Recherche par mots-clés
              </label>
              <input
                type="text"
                id="search"
                placeholder="Ex: formation, imagerie, certification..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                Organisation
              </label>
              <select
                id="organization"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Toutes les organisations</option>
                <option value="cour-comptes">Cour des comptes</option>
                <option value="igas">IGAS</option>
                <option value="ordres">Ordres professionnels</option>
                <option value="gouvernement">Gouvernement</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Année
              </label>
              <select
                id="year"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Toutes les années</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6">
            <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors">
              Rechercher
            </button>
          </div>
        </section>
      </div>
    </>
  );
};

export default Rapports;