'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileIcon, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CaseFile } from '@/hooks/useCaseManager';
import { uploadFile } from '@/lib/supabase/storage';

interface FileUploadAreaProps {
  onFilesSelected: (files: CaseFile[]) => void;
  existingFiles?: CaseFile[];
  onDeleteFile?: (fileId: string) => void;
  maxSize?: number; // in MB
}

export function FileUploadArea({
  onFilesSelected,
  existingFiles = [],
  onDeleteFile,
  maxSize = 50,
}: FileUploadAreaProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const uploadToSupabase = async (file: File): Promise<CaseFile> => {
    try {
      const { path, url, name, type } = await uploadFile(file);
      return {
        id: Date.now().toString() + Math.random().toString(),
        fileName: name,
        fileType: type,
        fileData: url, // Store the public URL
        uploadedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error("Upload failed", err);
      throw err;
    }
  };

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    const validFiles: CaseFile[] = [];

    setIsUploading(true);

    for (const file of fileArray) {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize}MB.`);
        continue;
      }

      try {
        const caseFile = await uploadToSupabase(file);
        validFiles.push(caseFile);
      } catch (error) {
        alert(`Failed to upload file ${file.name}`);
      }
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }

    setIsUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    handleDrag(e);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
    setIsDragActive(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileIcon className="w-4 h-4" />;
  };

  const downloadFile = (file: CaseFile) => {
    const link = document.createElement('a');
    link.href = file.fileData;
    link.target = "_blank";
    link.download = file.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (fileData: string): string => {
    // We don't have file size for URL based files easily accessible without metadata
    // Check if it's base64 (old) or URL (new)
    if (fileData.startsWith('data:')) {
      const bytes = (fileData.length * 3) / 4;
      if (bytes < 1024) return bytes.toFixed(0) + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    return 'Cloud File';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 transition-colors text-center cursor-pointer ${isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          ) : (
            <Upload className="w-8 h-8 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">{isUploading ? 'Uploading...' : 'Drag and drop files here'}</p>
            {!isUploading && (
              <p className="text-xs text-muted-foreground">
                or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary hover:underline font-medium"
                >
                  browse files
                </button>
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Maximum file size: {maxSize}MB. Supported: Images, PDF, Documents
          </p>
        </div>
      </div>

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Files ({existingFiles.length})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {existingFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:bg-secondary/30 transition-colors"
                title={`${file.fileName} (${formatFileSize(file.fileData)})`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {file.fileType.startsWith('image/') ? (
                    <img
                      src={file.fileData}
                      alt={file.fileName}
                      className="w-8 h-8 object-cover rounded"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 bg-secondary rounded">
                      {getFileIcon(file.fileType)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  {file.fileType.startsWith('image/') && (
                    <a
                      href={file.fileData}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-secondary rounded transition-colors"
                      title="View full size"
                    >
                      <Image className="w-4 h-4 text-muted-foreground" />
                    </a>
                  )}
                  <button
                    onClick={() => downloadFile(file)}
                    className="p-1 hover:bg-secondary rounded transition-colors"
                    title="Download"
                  >
                    <FileIcon className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {onDeleteFile && (
                    <button
                      onClick={() => onDeleteFile(file.id)}
                      className="p-1 hover:bg-destructive/10 rounded transition-colors"
                      title="Delete"
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
