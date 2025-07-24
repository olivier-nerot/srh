import React from 'react';
import { FileText } from 'lucide-react';
import { siteContent } from '../data/content';
import InfoCard from '../components/ui/InfoCard';

const Communiques: React.FC = () => {
  // Filter news items to show only Communiques
  const communiques = siteContent.news.filter(item => 
    item.category === 'Communiqué'
  );

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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {communiques.map((communique) => (
            <InfoCard 
              key={communique.id} 
              article={communique}
            />
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