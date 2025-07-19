import React from 'react';
import { Calendar, FileText } from 'lucide-react';

const Publications: React.FC = () => {
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

  return (
    <>
      {/* Blue curved header section */}
      <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Nos publications</h1>
          <p className="text-xl opacity-90">Newsletters et publications du SRH</p>
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" 
             style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}}></div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

        {/* Newsletter Subscription */}
        <section className="bg-blue-50 rounded-lg p-8 mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Restez informé</h2>
          <p className="text-gray-700 mb-6">
            Inscrivez-vous pour recevoir nos newsletters directement dans votre boîte mail.
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

export default Publications;