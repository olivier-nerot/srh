import React from 'react';
import { ExternalLink, Building, FileText, Users, GraduationCap, Stethoscope } from 'lucide-react';

const NosLiens: React.FC = () => {
  const linkCategories = [
    {
      title: "Institutions et organismes officiels",
      icon: Building,
      color: "blue",
      links: [
        {
          name: "Ministère de la Santé et de la Prévention",
          url: "https://sante.gouv.fr/",
          description: "Site officiel du ministère de la Santé",
          logo: "https://upload.wikimedia.org/wikipedia/fr/thumb/4/49/Minist%C3%A8re_des_Solidarit%C3%A9s_et_de_la_Sant%C3%A9.svg/200px-Minist%C3%A8re_des_Solidarit%C3%A9s_et_de_la_Sant%C3%A9.svg.png"
        },
        {
          name: "Agence Nationale de Sécurité du Médicament (ANSM)",
          url: "https://ansm.sante.fr/",
          description: "Autorité de santé française pour les médicaments et dispositifs médicaux",
          logo: "https://ansm.sante.fr/var/site/storage/images/_aliases/logo_main/media/logo-ansm/203-1-fre-FR/LOGO-ANSM.png"
        },
        {
          name: "Haute Autorité de Santé (HAS)",
          url: "https://www.has-sante.fr/",
          description: "Autorité publique indépendante à caractère scientifique",
          logo: "https://www.has-sante.fr/themes/custom/has/logo.svg"
        },
        {
          name: "Direction Générale de l'Offre de Soins (DGOS)",
          url: "https://sante.gouv.fr/ministere/organisation/directions/",
          description: "Direction du ministère chargée de l'offre de soins",
          logo: "https://upload.wikimedia.org/wikipedia/fr/thumb/4/49/Minist%C3%A8re_des_Solidarit%C3%A9s_et_de_la_Sant%C3%A9.svg/200px-Minist%C3%A8re_des_Solidarit%C3%A9s_et_de_la_Sant%C3%A9.svg.png"
        }
      ]
    },
    {
      title: "Organisations professionnelles",
      icon: Users,
      color: "green",
      links: [
        {
          name: "Conseil National de l'Ordre des Médecins",
          url: "https://www.conseil-national.medecin.fr/",
          description: "Instance ordinale des médecins en France",
          logo: "https://www.conseil-national.medecin.fr/sites/default/files/logo_cnom.png"
        },
        {
          name: "Société Française de Radiologie (SFR)",
          url: "https://www.sfr-radiologie.fr/",
          description: "Société savante de radiologie française"
        },
        {
          name: "Collège des Enseignants de Radiologie de France (CERF)",
          url: "https://www.cerf.radiologie.fr/",
          description: "Collège universitaire de radiologie"
        },
        {
          name: "Fédération Hospitalière de France (FHF)",
          url: "https://www.fhf.fr/",
          description: "Fédération des établissements hospitaliers publics"
        }
      ]
    },
    {
      title: "Formation et emploi",
      icon: GraduationCap,
      color: "purple",
      links: [
        {
          name: "Centre National de Gestion (CNG)",
          url: "https://www.cng.sante.fr/",
          description: "Gestion des carrières des praticiens hospitaliers"
        },
        {
          name: "Journées Françaises de Radiologie (JFR)",
          url: "https://www.jfr.radiologie.fr/",
          description: "Congrès annuel de radiologie"
        },
        {
          name: "Développement Professionnel Continu (DPC)",
          url: "https://www.agencedpc.fr/",
          description: "Plateforme de formation continue"
        },
        {
          name: "UNAFORMEC Rhône-Alpes",
          url: "https://www.unaformec-rhonealpes.org/",
          description: "Union Nationale des Associations de Formation Médicale Continue"
        }
      ]
    },
    {
      title: "Ressources techniques et scientifiques",
      icon: Stethoscope,
      color: "red",
      links: [
        {
          name: "Institut de Radioprotection et de Sûreté Nucléaire (IRSN)",
          url: "https://www.irsn.fr/",
          description: "Organisme public d'expertise et de recherche en radioprotection"
        },
        {
          name: "European Society of Radiology (ESR)",
          url: "https://www.myesr.org/",
          description: "Société européenne de radiologie"
        },
        {
          name: "Radiological Society of North America (RSNA)",
          url: "https://www.rsna.org/",
          description: "Société nord-américaine de radiologie"
        },
        {
          name: "Société Française de Médecine Nucléaire (SFMN)",
          url: "https://www.sfmn.org/",
          description: "Société savante de médecine nucléaire"
        }
      ]
    },
    {
      title: "Publications et documentation",
      icon: FileText,
      color: "yellow",
      links: [
        {
          name: "Legifrance",
          url: "https://www.legifrance.gouv.fr/",
          description: "Service public de la diffusion du droit français"
        },
        {
          name: "Journal Officiel de la République Française",
          url: "https://www.journal-officiel.gouv.fr/",
          description: "Publication officielle des lois et décrets"
        },
        {
          name: "PubMed",
          url: "https://pubmed.ncbi.nlm.nih.gov/",
          description: "Base de données de littérature médicale"
        },
        {
          name: "Journal of Medical Internet Research",
          url: "https://www.jmir.org/",
          description: "Revue scientifique en ligne sur la e-santé"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Nos liens</h1>
        
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
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start flex-1">
                          {link.logo && (
                            <img 
                              src={link.logo} 
                              alt={`Logo ${link.name}`}
                              className="w-8 h-8 mr-3 object-contain flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <h3 className="text-lg font-semibold text-gray-900 flex-1">
                            {link.name}
                          </h3>
                        </div>
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