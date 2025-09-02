import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, FileText } from 'lucide-react';

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  onTextExtracted?: (text: string) => void;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelected,
  onTextExtracted,
  className = ''
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedImage(file);
      onImageSelected(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Simulate OCR text extraction (in real implementation, this would call an OCR API)
      setProcessing(true);
      setTimeout(() => {
        const mockExtractedText = `Medicine Name: Paracetamol 500mg
Brand: Crocin
Manufacturer: GSK Pharmaceuticals
Batch No: PCM001
Expiry Date: 12/2025
MRP: ₹25.00
HSN: 30049099`;
        
        setExtractedText(mockExtractedText);
        onTextExtracted?.(mockExtractedText);
        setProcessing(false);
      }, 2000);
    }
  }, [onImageSelected, onTextExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setExtractedText('');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <ImageIcon className="w-5 h-5 text-blue-600" />
          <span>Medicine Image Upload</span>
        </h3>
        
        {!selectedImage ? (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {isDragActive ? 'Drop the image here' : 'Upload medicine package or label'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop an image, or click to select
            </p>
            <p className="text-xs text-gray-400">
              Supports: JPEG, PNG, GIF, BMP, WebP (Max 10MB)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={imagePreview!}
                alt="Medicine preview"
                className="w-full max-w-md mx-auto rounded-lg shadow-md"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {selectedImage.name}
              </p>
              <p className="text-xs text-gray-500">
                {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Extracted Text */}
      {(processing || extractedText) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-green-600" />
            <span>Extracted Information</span>
          </h3>
          
          {processing ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Processing image with AI...</span>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {extractedText}
              </pre>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>AI Suggestion:</strong> The form below has been auto-filled based on the extracted information. 
                  Please review and modify as needed before saving.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};