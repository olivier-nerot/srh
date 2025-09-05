import React, { useState, useEffect } from 'react';
import { ExternalLink, Building, Users, GraduationCap, Edit, Plus, Trash2, Save, X, Upload } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import QuillEditor from 'quill-next-react';
import 'quill-next/dist/quill.snow.css';

interface Lien {
  id: number;
  icon: string;
  title: string;
  description: string;
  category: string;
  url: string;
  logo: string | null;
  picture: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EditingLien {
  id?: number;
  icon: string;
  title: string;
  description: string;
  category: string;
  url: string;
  logo: string;
  picture: string;
}

interface LinkCategory {
  title: string;
  icon: typeof Users | typeof GraduationCap | typeof Building;
  color: string;
  links: Lien[];
}

// Helper function to get the correct logo source
const getLogoSrc = (link: Lien): string => {
  const logoUrl = link.picture || link.logo || '';
  
  // Only accept base64 data URLs - all logos should be stored as base64 in database
  if (logoUrl.startsWith('data:')) {
    return logoUrl;
  }
  
  // If it's not base64, return empty string to hide the image
  // This ensures we never use file paths and only use properly stored base64 images
  return '';
};

const NosLiens: React.FC = () => {
  const { user } = useAuthStore();
  const [liens, setLiens] = useState<Lien[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingLien | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [quillRef, setQuillRef] = useState<any>(null);
  const [hasEditorContent, setHasEditorContent] = useState(false);

  const isAdmin = user?.isadmin === true;

  useEffect(() => {
    fetchLiens();
  }, []);

  const fetchLiens = async () => {
    try {
      const response = await fetch('/api/content?contentType=liens');
      const data = await response.json();
      if (data.success) {
        setLiens(data.liens);
      }
    } catch (error) {
      console.error('Error fetching liens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editing || !isAdmin) return;

    // Get the current content from the Quill editor as plain text
    let description = editing.description;
    if (quillRef) {
      description = quillRef.getText().trim();
    }

    try {
      const url = '/api/content?contentType=liens';
      const method = editing.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editing,
          description,
          isAdmin: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchLiens(); // Refresh the list
        setEditing(null);
        setShowAddForm(false);
        setQuillRef(null);
      } else {
        alert('Erreur lors de la sauvegarde: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving lien:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: number) => {
    if (!isAdmin || !confirm('Êtes-vous sûr de vouloir supprimer ce lien ?')) return;

    try {
      const response = await fetch('/api/content?contentType=liens', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          isAdmin: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchLiens(); // Refresh the list
      } else {
        alert('Erreur lors de la suppression: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting lien:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const startEdit = (lien: Lien) => {
    setQuillRef(null);
    setHasEditorContent(false);
    setEditing({
      id: lien.id,
      icon: lien.icon,
      title: lien.title,
      description: lien.description,
      category: lien.category,
      url: lien.url,
      logo: lien.logo || '',
      picture: lien.picture || '',
    });
    setShowAddForm(false);
  };

  const startAdd = () => {
    setQuillRef(null);
    setHasEditorContent(false);
    setEditing({
      icon: 'Users', // Default icon, will be set based on category
      title: '',
      description: '',
      category: 'Organisations professionnelles et syndicats',
      url: '',
      logo: '',
      picture: '',
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditing(null);
    setShowAddForm(false);
    setQuillRef(null);
  };

  // Group liens by category
  const linkCategories: LinkCategory[] = [
    {
      title: "Organisations professionnelles et syndicats",
      icon: Users,
      color: "blue",
      links: liens.filter(lien => lien.category === "Organisations professionnelles et syndicats")
    },
    {
      title: "Sociétés savantes et formations",
      icon: GraduationCap, 
      color: "green",
      links: liens.filter(lien => lien.category === "Sociétés savantes et formations")
    },
    {
      title: "Partenaires industriels",
      icon: Building,
      color: "red", 
      links: liens.filter(lien => lien.category === "Partenaires industriels")
    }
  ];

  const quillConfig = {
    theme: 'snow',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link'],
        ['clean']
      ],
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-srh-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des liens...</p>
        </div>
      </div>
    );
  }


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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Nos liens</h1>
              <p className="text-xl opacity-90">Ressources et partenaires institutionnels</p>
            </div>
            {isAdmin && !editing && (
              <button
                onClick={startAdd}
                className="bg-white text-srh-blue hover:bg-gray-100 px-4 py-2 rounded-md flex items-center gap-2 transition-colors font-medium"
              >
                <Plus className="h-4 w-4" />
                Nouveau lien
              </button>
            )}
          </div>
        </div>
        {/* Curved bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" 
             style={{clipPath: 'ellipse(100% 100% at 50% 100%)'}}></div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Add/Edit Form */}
        {editing && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">
              {showAddForm ? 'Ajouter un nouveau lien' : 'Modifier le lien'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre
                </label>
                <input
                  type="text"
                  value={editing.title}
                  onChange={(e) => setEditing({...editing, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-srh-blue"
                  placeholder="Nom de l'organisation..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={editing.url}
                  onChange={(e) => setEditing({...editing, url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-srh-blue"
                  placeholder="https://example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  value={editing.category}
                  onChange={(e) => {
                    const category = e.target.value;
                    let icon = 'Users'; // default
                    if (category === 'Sociétés savantes et formations') icon = 'GraduationCap';
                    else if (category === 'Partenaires industriels') icon = 'Building';
                    setEditing({...editing, category, icon});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-srh-blue"
                >
                  <option value="Organisations professionnelles et syndicats">Organisations professionnelles et syndicats</option>
                  <option value="Sociétés savantes et formations">Sociétés savantes et formations</option>
                  <option value="Partenaires industriels">Partenaires industriels</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo (URL)
                </label>
                <input
                  type="text"
                  value={editing.logo}
                  onChange={(e) => setEditing({...editing, logo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-srh-blue"
                  placeholder="URL du logo ou chemin relatif..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo (Upload)
                </label>
                <div className="space-y-3">
                  {editing.picture && (
                    <div className="relative inline-block">
                      <img
                        src={editing.picture}
                        alt="Logo preview"
                        className="w-20 h-20 object-contain border border-gray-200 rounded-md bg-white p-2"
                      />
                      <button
                        type="button"
                        onClick={() => setEditing({...editing, picture: ''})}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                        title="Supprimer le logo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Validate file size (max 500KB)
                          if (file.size > 500 * 1024) {
                            alert('Fichier trop volumineux. Taille maximale : 500KB.');
                            return;
                          }
                          
                          // Validate file type
                          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                          if (!allowedTypes.includes(file.type)) {
                            alert('Type de fichier non supporté. Utilisez JPEG, PNG ou WebP.');
                            return;
                          }
                          
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64 = event.target?.result as string;
                            setEditing({...editing, picture: base64});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      Choisir un fichier
                    </label>
                    <span className="text-xs text-gray-500">
                      JPEG, PNG ou WebP - Max 500KB
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <QuillEditor
                  onReady={(quill) => {
                    setQuillRef(quill);
                    
                    // Set up text-change event listener
                    quill.on('text-change', (_delta, _oldDelta, source) => {
                      if (source === 'user') {
                        const text = quill.getText().trim();
                        setHasEditorContent(text.length > 0);
                      }
                    });
                    
                    // Set initial content
                    if (editing?.description) {
                      quill.setText(editing.description);
                      setHasEditorContent(editing.description.trim().length > 0);
                    } else {
                      setHasEditorContent(false);
                    }
                  }}
                  config={quillConfig}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSave}
                  disabled={!editing.title.trim() || !editing.url.trim() || !hasEditorContent}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Sauvegarder
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
        
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
                  {category.links.map((link) => (
                    <div
                      key={link.id}
                      className={`border rounded-lg p-6 hover:shadow-lg transition-shadow ${getColorClasses(category.color)}`}
                    >
                      <div className="flex gap-4 h-full">
                        {/* Logo on the left */}
                        <div className="flex-shrink-0 w-20">
                          {(link.picture || link.logo) && (
                            <img 
                              src={getLogoSrc(link)} 
                              alt={`Logo ${link.title}`}
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
                              {link.title}
                            </h3>
                            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                              {/* Admin Controls */}
                              {isAdmin && !editing && (
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => startEdit(link)}
                                    className="text-gray-500 hover:text-gray-700 p-1 transition-colors"
                                    title="Éditer"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(link.id)}
                                    className="text-gray-500 hover:text-red-600 p-1 transition-colors"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
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

      </div>
    </>
  );
};

export default NosLiens;