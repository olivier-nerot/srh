import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, Download } from 'lucide-react';

interface Document {
  id: number;
  title: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

interface DocumentUploadProps {
  onDocumentsChange: (documentIds: number[]) => void;
  currentDocumentIds?: number[];
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  onDocumentsChange, 
  currentDocumentIds = [] 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch documents when currentDocumentIds changes
  useEffect(() => {
    const fetchDocuments = async () => {
      if (currentDocumentIds.length === 0) {
        setDocuments([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/documents-by-ids?ids=${currentDocumentIds.join(',')}`);
        const data = await response.json();
        
        if (data.success) {
          setDocuments(data.documents);
        } else {
          console.error('Error fetching documents:', data.error);
          setError('Erreur lors du chargement des documents');
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Erreur lors du chargement des documents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [currentDocumentIds]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = async (files: FileList) => {
    setError(null);
    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ];
        
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`Type de fichier non supporté pour ${file.name}. Utilisez PDF, DOC, DOCX ou TXT.`);
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Fichier ${file.name} trop volumineux. Taille maximale : 10MB.`);
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Upload to API
        const response = await fetch('/api/upload-document', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: Array.from(buffer), // Convert Uint8Array to regular array
            fileName: file.name,
            mimeType: file.type,
            title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for title
            description: '',
            uploadedBy: null, // This should come from auth context
            isAdmin: true,
          }),
        });

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || `Erreur lors de l'upload de ${file.name}`);
        }

        return data.document;
      });

      const uploadedDocuments = await Promise.all(uploadPromises);
      const updatedDocuments = [...documents, ...uploadedDocuments];
      
      setDocuments(updatedDocuments);
      onDocumentsChange(updatedDocuments.map(doc => doc.id));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
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
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveDocument = (documentId: number) => {
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    setDocuments(updatedDocuments);
    onDocumentsChange(updatedDocuments.map(doc => doc.id));
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType === 'text/plain') return '📄';
    return '📎';
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Documents joints
      </label>
      
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-srh-blue bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isUploading ? handleClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
          multiple
        />
        
        <div className="space-y-4">
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-srh-blue"></div>
              <p className="text-sm text-gray-600 mt-2">Upload en cours...</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="rounded-full bg-gray-100 p-3">
                  <Upload className="h-6 w-6 text-gray-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-srh-blue">Cliquez pour sélectionner</span> ou glissez-déposez des documents
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, DOC, DOCX ou TXT - Maximum 10MB par fichier
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Document List */}
      {(documents.length > 0 || isLoading) && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Documents joints {!isLoading && `(${documents.length})`}
            {isLoading && (
              <span className="ml-2">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-srh-blue"></div>
              </span>
            )}
          </h4>
          <div className="space-y-2">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-lg">{getFileIcon(document.mimeType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {document.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {document.fileName} • {formatFileSize(document.fileSize)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={document.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-srh-blue hover:text-srh-blue-dark transition-colors"
                    title="Télécharger"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveDocument(document.id)}
                    className="text-red-500 hover:text-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
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

export default DocumentUpload;