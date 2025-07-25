import React, { useState, useRef } from 'react';
import { X, Image } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (base64: string) => void;
  currentImage?: string;
  onImageRemove?: () => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImageSelect, 
  currentImage, 
  onImageRemove 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Type de fichier non supporté. Utilisez JPEG, PNG ou WebP.');
      }

      // Validate file size (max 500KB)
      if (file.size > 500 * 1024) {
        throw new Error('Fichier trop volumineux. Taille maximale : 500KB.');
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          
          // Process through API for validation and optimization
          const response = await fetch('/api/upload-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file: base64,
              fileName: file.name,
              mimeType: file.type,
              isAdmin: true, // This should come from auth context in real app
            }),
          });

          const data = await response.json();
          
          if (data.success) {
            onImageSelect(data.base64);
          } else {
            throw new Error(data.error || 'Erreur lors du traitement de l\'image');
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        setError('Erreur lors de la lecture du fichier');
        setIsProcessing(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    if (onImageRemove) {
      onImageRemove();
    }
    setError(null);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Image de couverture
      </label>
      
      {currentImage ? (
        <div className="relative">
          <img
            src={currentImage}
            alt="Publication cover"
            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
            title="Supprimer l'image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-srh-blue bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!isProcessing ? handleClick : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isProcessing}
          />
          
          <div className="space-y-4">
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-srh-blue"></div>
                <p className="text-sm text-gray-600 mt-2">Traitement en cours...</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="rounded-full bg-gray-100 p-3">
                    <Image className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-srh-blue">Cliquez pour sélectionner</span> ou glissez-déposez une image
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPEG, PNG ou WebP - Maximum 500KB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;