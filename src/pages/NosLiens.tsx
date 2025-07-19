import React from 'react';
import { ExternalLink, Building, Users, GraduationCap } from 'lucide-react';

// Import partner logos
import afibLogo from '../assets/images/partner-logos/afib.png';
import afppeLogo from '../assets/images/partner-logos/afppe.png';
import apirLogo from '../assets/images/partner-logos/apir.png';
import appaLogo from '../assets/images/partner-logos/appa.jpg';
import cngLogo from '../assets/images/partner-logos/cng.png';
import cnehLogo from '../assets/images/partner-logos/cneh.png';
import cerfLogo from '../assets/images/partner-logos/cerf.png';
import aphpLogo from '../assets/images/partner-logos/aphp.png';
import cnpmemLogo from '../assets/images/partner-logos/cnpmem.png';
import cnomLogo from '../assets/images/partner-logos/cnom.png';
import cnpg4Logo from '../assets/images/partner-logos/cnpg4.png';
import fmcrimLogo from '../assets/images/partner-logos/fmcrim.png';
import fhfLogo from '../assets/images/partner-logos/fhf.png';
import fnmrLogo from '../assets/images/partner-logos/fnmr.png';
import specialitesMedicalesLogo from '../assets/images/partner-logos/specialites-medicales.png';
import lehLogo from '../assets/images/partner-logos/leh.png';
import sfrLogo from '../assets/images/partner-logos/sfr.jpeg';
import snamhpLogo from '../assets/images/partner-logos/snamhp.png';
import unirLogo from '../assets/images/partner-logos/unir.png';
import braccoLogo from '../assets/images/partner-logos/bracco.png';
import fujifilmLogo from '../assets/images/partner-logos/fujifilm.png';
import geHealthcareLogo from '../assets/images/partner-logos/ge-healthcare.png';
import guerbetLogo from '../assets/images/partner-logos/guerbet.png';
import siemensLogo from '../assets/images/partner-logos/siemens.png';
import terumoLogo from '../assets/images/partner-logos/terumo.png';
import toshibaLogo from '../assets/images/partner-logos/toshiba.png';

const NosLiens: React.FC = () => {
  const linkCategories = [
    {
      title: "Organisations professionnelles et syndicats",
      icon: Users,
      color: "blue",
      links: [
        {
          name: "Association Française des Ingénieurs Biomédicaux (AFIB)",
          url: "https://afib.asso.fr/",
          description: "Association des ingénieurs biomédicaux",
          logo: afibLogo
        },
        {
          name: "Association Française du Personnel Paramédical d'Électroradiologie (AFPPE)",
          url: "https://www.afppe.com/",
          description: "Association du personnel paramédical d'électroradiologie",
          logo: afppeLogo
        },
        {
          name: "Association Parisienne des Internes en Radiologie (APIR)",
          url: "https://www.apir-radio.com/",
          description: "Association des internes en radiologie de Paris",
          logo: apirLogo
        },
        {
          name: "Association pour les Praticiens Hospitaliers et Assimilés (APPA)",
          url: "https://www.appa-asso.org/appa",
          description: "Association des praticiens hospitaliers",
          logo: appaLogo
        },
        {
          name: "Centre National de Gestion (CNG)",
          url: "https://www.cng.sante.fr/",
          description: "Gestion des carrières des praticiens hospitaliers",
          logo: cngLogo
        },
        {
          name: "Centre National d'Expertise Hospitalière (CNEH)",
          url: "https://www.cneh.fr/",
          description: "Centre d'expertise hospitalière",
          logo: cnehLogo
        },
        {
          name: "Collège des Enseignants de Radiologie de France (CERF)",
          url: "https://cerf.radiologie.fr/",
          description: "Collège universitaire de radiologie",
          logo: cerfLogo
        },
        {
          name: "Collégiale des Radiologues de l'AP-HP",
          url: "https://www.radiologues-aphp.fr/",
          description: "Collégiale des radiologues de l'Assistance Publique - Hôpitaux de Paris",
          logo: aphpLogo
        },
        {
          name: "Conseil National Professionnel de Médecine d'Urgence (CNPMEM)",
          url: "https://www.cnpmem.fr/",
          description: "Conseil national professionnel de médecine d'urgence",
          logo: cnpmemLogo
        },
        {
          name: "Conseil National de l'Ordre des Médecins (CNOM)",
          url: "https://www.conseil-national.medecin.fr/",
          description: "Instance ordinale des médecins en France",
          logo: cnomLogo
        }
      ]
    },
    {
      title: "Sociétés savantes et formations",
      icon: GraduationCap,
      color: "green",
      links: [
        {
          name: "Centre National Professionnel de Gérontologie 4 (CNPG4)",
          url: "https://www.cnpg4-radiologie.fr/",
          description: "Centre national professionnel de gérontologie",
          logo: cnpg4Logo
        },
        {
          name: "Fédération de Médecine Continue et de Recherche en Imagerie Médicale (FMCRIM)",
          url: "http://www.fmcrim.fr/#accueil",
          description: "Fédération de médecine continue en imagerie médicale",
          logo: fmcrimLogo
        },
        {
          name: "Fédération Hospitalière de France (FHF)",
          url: "https://www.fhf.fr/",
          description: "Fédération des établissements hospitaliers publics",
          logo: fhfLogo
        },
        {
          name: "Fédération Nationale de Médecine du Travail et de Radioprotection (FNMR)",
          url: "https://www.fnmr.org/",
          description: "Fédération nationale de médecine du travail",
          logo: fnmrLogo
        },
        {
          name: "Intersyndicat National des Spécialités Médicales",
          url: "http://www.specialitesmedicales.org/",
          description: "Intersyndicat des spécialités médicales",
          logo: specialitesMedicalesLogo
        },
        {
          name: "Les Entreprises Hospitalières (LEH)",
          url: "https://www.leh.fr/",
          description: "Association des entreprises hospitalières",
          logo: lehLogo
        },
        {
          name: "Société Française de Radiologie (SFR)",
          url: "http://www.sfrnet.org/",
          description: "Société savante de radiologie française",
          logo: sfrLogo
        },
        {
          name: "Syndicat National des Médecins Hospitaliers Praticiens (SNAMHP)",
          url: "https://www.snamhp.org/",
          description: "Syndicat des médecins hospitaliers praticiens",
          logo: snamhpLogo
        },
        {
          name: "Union Nationale des Internes et Jeunes Radiologues (UNIR)",
          url: "https://unir-radio.fr/",
          description: "Union des internes et jeunes radiologues",
          logo: unirLogo
        }
      ]
    },
    {
      title: "Partenaires industriels",
      icon: Building,
      color: "red",
      links: [
        {
          name: "Bracco",
          url: "https://www.bracco.com/en",
          description: "Entreprise spécialisée en produits de contraste et imagerie diagnostique",
          logo: braccoLogo
        },
        {
          name: "Fujifilm Healthcare",
          url: "https://www.fujifilm.com/uk/en/healthcare",
          description: "Solutions d'imagerie médicale et de diagnostic",
          logo: fujifilmLogo
        },
        {
          name: "GE Healthcare",
          url: "https://www.gehealthcare.fr/",
          description: "Technologies médicales et solutions d'imagerie",
          logo: geHealthcareLogo
        },
        {
          name: "Guerbet",
          url: "https://www.guerbet.com/fr",
          description: "Spécialiste mondial des produits de contraste",
          logo: guerbetLogo
        },
        {
          name: "Siemens Healthineers",
          url: "https://www.siemens-healthineers.com/fr",
          description: "Technologies médicales avancées",
          logo: siemensLogo
        },
        {
          name: "Terumo Europe",
          url: "http://terumo-europe.com/",
          description: "Dispositifs médicaux et solutions interventionnelles",
          logo: terumoLogo
        },
        {
          name: "Toshiba Medical",
          url: "https://www.toshiba-medical.eu/fr/",
          description: "Systèmes d'imagerie médicale",
          logo: toshibaLogo
        }
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-50 border-blue-200 text-blue-700",
      green: "bg-green-50 border-green-200 text-green-700",
      purple: "bg-purple-50 border-purple-200 text-purple-700",
      red: "bg-red-50 border-red-200 text-red-700",
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-700"
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getIconColorClasses = (color: string) => {
    const colorMap = {
      blue: "text-blue-600",
      green: "text-green-600",
      purple: "text-purple-600",
      red: "text-red-600",
      yellow: "text-yellow-600"
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <>
      {/* Blue curved header section */}
      <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Nos liens</h1>
          <p className="text-xl opacity-90">Ressources et partenaires institutionnels</p>
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" 
             style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}}></div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <p className="text-lg text-gray-700">
            Retrouvez ici une sélection de liens utiles pour votre pratique professionnelle : 
            institutions officielles, organisations professionnelles, ressources de formation 
            et documentation scientifique.
          </p>
        </div>

        <div className="space-y-12">
          {linkCategories.map((category, categoryIndex) => {
            const IconComponent = category.icon;
            return (
              <section key={categoryIndex}>
                <div className="flex items-center mb-6">
                  <IconComponent className={`h-8 w-8 mr-3 ${getIconColorClasses(category.color)}`} />
                  <h2 className="text-2xl font-bold text-gray-900">{category.title}</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.links.map((link, linkIndex) => (
                    <div
                      key={linkIndex}
                      className={`border rounded-lg p-6 hover:shadow-lg transition-shadow ${getColorClasses(category.color)}`}
                    >
                      <div className="flex gap-4 h-full">
                        {/* Logo on the left */}
                        <div className="flex-shrink-0 w-20">
                          {link.logo && (
                            <img 
                              src={link.logo} 
                              alt={`Logo ${link.name}`}
                              className="w-full h-full object-contain bg-white rounded-lg border border-gray-200 p-2"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                        
                        {/* Content on the right */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 flex-1">
                              {link.name}
                            </h3>
                            <ExternalLink className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" />
                          </div>
                          
                          <p className="text-gray-700 mb-4 text-sm">
                            {link.description}
                          </p>
                          
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center text-sm font-medium hover:underline ${getIconColorClasses(category.color)}`}
                          >
                            Visiter le site
                            <ExternalLink className="h-4 w-4 ml-1" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Additional Information */}
        <div className="mt-16 bg-gray-50 border border-gray-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Information importante</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              <strong>Avertissement :</strong> Les liens externes proposés sur cette page 
              le sont à titre informatif uniquement. Le SRH ne peut être tenu responsable 
              du contenu de ces sites externes.
            </p>
            <p>
              Si vous constatez qu'un lien ne fonctionne plus ou si vous souhaitez suggérer 
              l'ajout d'un nouveau lien utile, n'hésitez pas à{' '}
              <a href="/contactez-nous" className="text-blue-600 hover:text-blue-700 underline">
                nous contacter
              </a>.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Actions rapides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="/jadhere-au-srh"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Adhérer au SRH
            </a>
            <a
              href="/contactez-nous"
              className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Nous contacter
            </a>
            <a
              href="/nos-informations"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Nos publications
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default NosLiens;