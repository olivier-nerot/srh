import React from 'react';
import { FileText, Download, Calendar } from 'lucide-react';

const JO: React.FC = () => {
  const journalOfficielTexts = [
    {
      title: "Décret n° 2024-940 modifiant les dispositions statutaires relatives au personnel hospitalier-universitaire",
      date: "2024-10-01",
      category: "Décret"
    },
    {
      title: "Décrets sur l'affiliation retraite du personnel hospitalo-universitaire",
      date: "2024-09-01",
      category: "Décret"
    },
    {
      title: "Décret sur la certification périodique des professionnels de santé",
      date: "2024-08-01",
      category: "Décret"
    },
    {
      title: "Décrets sur les conditions d'équipement en imagerie médicale",
      date: "2022-06-01",
      category: "Décret"
    },
    {
      title: "Décrets relatifs au statut des praticiens contractuels",
      date: "2022-05-01",
      category: "Décret"
    },
    {
      title: "Instructions sur la rémunération et les activités des praticiens hospitaliers",
      date: "2022-04-01",
      category: "Instruction"
    }
  ];

  return (
    <>
      {/* Blue curved header section */}
      <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Textes du Journal Officiel</h1>
          <p className="text-xl opacity-90">Décrets, arrêtés et instructions officielles</p>
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" 
             style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}}></div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center mb-8">
          <FileText className="h-8 w-8 text-blue-600 mr-3" />
          <h2 className="text-3xl font-bold text-gray-900">Textes du Journal Officiel</h2>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Information importante</h3>
          <p className="text-blue-800">
            Cette section regroupe les textes officiels publiés au Journal Officiel qui concernent directement 
            l'exercice de la radiologie hospitalière, les statuts des praticiens et l'organisation des services.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {journalOfficielTexts.map((text, index) => (
            <article key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {text.category}
                </span>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(text.date).toLocaleDateString('fr-FR')}
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4 leading-tight">
                {text.title}
              </h3>
              
              <div className="flex items-center justify-between">
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  Consulter le texte
                </button>
                <Download className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
              </div>
            </article>
          ))}
        </div>

        {/* Search and Filter */}
        <section className="bg-gray-50 rounded-lg p-8 mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Rechercher dans les textes</h2>
          <p className="text-gray-700 mb-6">
            Utilisez les filtres ci-dessous pour trouver rapidement les textes officiels qui vous intéressent.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Recherche par mots-clés
              </label>
              <input
                type="text"
                id="search"
                placeholder="Ex: radiologie, praticien, certification..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              <select
                id="category"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Toutes les catégories</option>
                <option value="decret">Décrets</option>
                <option value="instruction">Instructions</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Année
              </label>
              <select
                id="year"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Rechercher
            </button>
          </div>
        </section>
      </div>
    </>
  );
};

export default JO;