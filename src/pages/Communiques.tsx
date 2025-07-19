import React from 'react';
import { Calendar, FileText } from 'lucide-react';

const Communiques: React.FC = () => {
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
      {/* Blue curved header section */}
      <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Communiqués</h1>
          <p className="text-xl opacity-90">Communiqués de presse et positions du SRH</p>
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" 
             style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}}></div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

        {/* Newsletter Subscription */}
        <section className="bg-blue-50 rounded-lg p-8 mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Restez informé</h2>
          <p className="text-gray-700 mb-6">
            Inscrivez-vous pour recevoir nos communiqués directement dans votre boîte mail.
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

export default Communiques;