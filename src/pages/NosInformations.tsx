import React from 'react';
import { Calendar, FileText } from 'lucide-react';

const NosInformations: React.FC = () => {
  const publications = [
    {
      title: "Newsletter Janvier 2025",
      excerpt: "Une très bonne année et surtout.. la santé ! Par le nouveau bureau du SRH.",
      date: "2025-01-01"
    },
    {
      title: "Newsletter Novembre 2024", 
      excerpt: "Retour sur les élections professionnelles 2024.",
      date: "2024-11-01"
    },
    {
      title: "Newsletter JFR Septembre 2024",
      excerpt: "SRH will be present at JFR. We'll be happy to see you, especially for our AG on Friday and at our stand.",
      date: "2024-09-01"
    },
    {
      title: "Newsletter Juillet 2024",
      excerpt: "Réforme des autorisations en radiologie... nécessité pour les diplômés avant 2023 de faire reconnaître leur compétence en Radiologie Interventionnelle Avancée",
      date: "2024-07-01"
    }
  ];

  const communiques = [
    {
      title: "LFSS 2025: pas d'économies sur la qualité !",
      excerpt: "Nos réflexions et propositions...",
      date: "2025-05-01"
    },
    {
      title: "Appel à une grève illimitée de la permanence des soins",
      excerpt: "Appel à une grève illimitée de la permanence des soins des praticiens des hôpitaux, dès le 1er Mai 2025.",
      date: "2025-04-01"
    },
    {
      title: "Des économies OK mais pas de bouts de chandelles !",
      excerpt: "L'adoption définitive du PLFSS 2025...",
      date: "2025-03-01"
    },
    {
      title: "Permanence des Soins : Merci l'hôpital !",
      excerpt: "Le SRH a examiné avec attention le rapport de la DGOS...",
      date: "2025-01-01"
    }
  ];

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Nos informations</h1>
        
        {/* Publications Section */}
        <section id="publications" className="mb-16">
          <div className="flex items-center mb-8">
            <FileText className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-3xl font-bold text-gray-900">Nos publications</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {publications.map((publication, index) => (
              <article key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex-1">
                    {publication.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 ml-4">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(publication.date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  {publication.excerpt}
                </p>
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  Lire la suite →
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* Communiqués Section */}
        <section id="communiques" className="mb-16">
          <div className="flex items-center mb-8">
            <FileText className="h-8 w-8 text-red-600 mr-3" />
            <h2 className="text-3xl font-bold text-gray-900">Communiqués</h2>
          </div>
          
          <div className="space-y-6">
            {communiques.map((communique, index) => (
              <article key={index} className="bg-red-50 border border-red-200 rounded-lg p-6 hover:bg-red-100 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex-1">
                    {communique.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 ml-4">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(communique.date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  {communique.excerpt}
                </p>
                <button className="text-red-600 hover:text-red-700 font-medium text-sm">
                  Lire le communiqué →
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* Newsletter Subscription */}
        <section className="bg-blue-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Restez informé</h2>
          <p className="text-gray-700 mb-6">
            Inscrivez-vous pour recevoir nos newsletters et communiqués directement dans votre boîte mail.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder="Votre adresse email"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
              S'inscrire
            </button>
          </div>
        </section>
      </div>
    </>
  );
};

export default NosInformations;