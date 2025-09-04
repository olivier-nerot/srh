import React, { useState } from 'react';
import { MapPin, Upload } from 'lucide-react';
import emailjs from '@emailjs/browser';
import Button from '../components/ui/Button';

const ContactezNous: React.FC = () => {
  const [formData, setFormData] = useState({
    subject: '',
    isMember: '',
    identity: '',
    contactDetails: '',
    message: '',
    anonymize: false
  });

  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
      alert('Le fichier ne peut pas dépasser 10 MB');
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      // EmailJS configuration
      const serviceId = 'service_8u9bwk6';
      const templateId = 'template_u7rrarv';
      const publicKey = 'k1t7oB9LVNDtMrKMa';

      // Prepare template parameters
      const templateParams = {
        subject: formData.subject,
        is_member: formData.isMember === 'yes' ? 'Oui' : 'Non',
        identity: formData.identity,
        contact_details: formData.contactDetails,
        message: formData.message,
        anonymize: formData.anonymize ? 'Oui' : 'Non',
        file_attached: file ? file.name : 'Aucun fichier',
        to_email: 'contact@srh-info.org',
      };

      // Send email using EmailJS
      await emailjs.send(serviceId, templateId, templateParams, publicKey);

      setSubmitStatus({
        type: 'success',
        message: 'Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.'
      });
      
      // Reset form
      setFormData({
        subject: '',
        isMember: '',
        identity: '',
        contactDetails: '',
        message: '',
        anonymize: false
      });
      setFile(null);

    } catch (error) {
      console.error('EmailJS error:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Erreur lors de l\'envoi du message. Veuillez réessayer plus tard.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Contactez-nous</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Nos coordonnées</h2>
            
            {/* Address */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <MapPin className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Adresse</h3>
                  <p className="text-gray-700">
                    15 rue Ferdinand Duval<br />
                    75004 PARIS<br />
                    France
                  </p>
                </div>
              </div>
            </div>

            {/* Bureau Members */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Bureau du SRH</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Président</h4>
                  <p className="text-gray-700">Docteur Thomas MARTINELLI</p>
                  <p className="text-gray-600 text-sm">Centre Hospitalier de Valence, Service de Radiologie</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Vice-Président Secrétaire Général</h4>
                  <p className="text-gray-700">Professeur Pierre Champsaur</p>
                  <p className="text-gray-600 text-sm">Hôpital Sainte Marguerite, AP-HM, Marseille</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Trésorière</h4>
                  <p className="text-gray-700">Professeure Nadya Pyatigorskaya</p>
                  <p className="text-gray-600 text-sm">CHU Pitié-Salpêtrière, AP-HP, Paris</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Trésorière adjointe</h4>
                  <p className="text-gray-700">Docteur Anne LIESSE</p>
                  <p className="text-gray-600 text-sm">Hôpital Victor Provo, Roubaix</p>
                </div>
              </div>
            </div>

            {/* Additional Resources */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ressources utiles</h3>
              <div className="space-y-2">
                <a href="/faq" className="block text-blue-600 hover:text-blue-700 transition-colors">
                  → FAQ - Questions fréquemment posées
                </a>
                <a 
                  href="https://fr.linkedin.com/in/syndicats-des-radiologues-hospitaliers-4a31881b0" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:text-blue-700 transition-colors"
                >
                  → Suivez-nous sur LinkedIn
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Envoyez-nous un message</h2>
            
            {/* Status Message */}
            {submitStatus.type && (
              <div className={`mb-6 p-4 rounded-md ${
                submitStatus.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {submitStatus.message}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Sujet de contact *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionnez un sujet</option>
                  <option value="adhesion">Adhésion au SRH</option>
                  <option value="information">Demande d'information</option>
                  <option value="presse">Contact presse</option>
                  <option value="juridique">Question juridique</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              {/* Member Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Êtes-vous membre du SRH ? *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="isMember"
                      value="yes"
                      checked={formData.isMember === 'yes'}
                      onChange={handleInputChange}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    Oui
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="isMember"
                      value="no"
                      checked={formData.isMember === 'no'}
                      onChange={handleInputChange}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    Non
                  </label>
                </div>
              </div>

              {/* Identity */}
              <div>
                <label htmlFor="identity" className="block text-sm font-medium text-gray-700 mb-2">
                  Identité *
                </label>
                <input
                  type="text"
                  id="identity"
                  name="identity"
                  required
                  value={formData.identity}
                  onChange={handleInputChange}
                  placeholder="Nom, prénom, titre"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Contact Details */}
              <div>
                <label htmlFor="contactDetails" className="block text-sm font-medium text-gray-700 mb-2">
                  Coordonnées *
                </label>
                <input
                  type="text"
                  id="contactDetails"
                  name="contactDetails"
                  required
                  value={formData.contactDetails}
                  onChange={handleInputChange}
                  placeholder="Email et/ou téléphone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Votre message..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* File Upload */}
              <div>
                <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier joint (optionnel, max 10 MB)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    id="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <label
                    htmlFor="file"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choisir un fichier
                  </label>
                  {file && (
                    <span className="text-sm text-gray-600">{file.name}</span>
                  )}
                </div>
              </div>

              {/* Anonymize Option */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="anonymize"
                  name="anonymize"
                  checked={formData.anonymize}
                  onChange={handleInputChange}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="anonymize" className="text-sm text-gray-700">
                  Anonymiser ma question (pour publication sur le site)
                </label>
              </div>

              {/* Submit Button */}
              <div>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactezNous;