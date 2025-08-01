'use client';

import type React from 'react';
import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export function FileUploadZone({ onFileUpload }: { onFileUpload: (file: File, onProgress: (progress: number) => void) => Promise<void> }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useTranslation(); // Default to 'th', or pass 'en' for English

  // ดึงค่าขนาดไฟล์สูงสุดจาก env (NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB)
  const MAX_UPLOAD_SIZE_MB = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB
    ? parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB, 10)
    : 100;
  const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
  const MAX_UPLOAD_SIZE_GB = (MAX_UPLOAD_SIZE_MB / 1024).toFixed(2);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        alert(`File ${file.name} is too large. Maximum size is ${MAX_UPLOAD_SIZE_MB}MB.`);
        continue;
      }

      try {
        await onFileUpload(file, (progress) => {
          // Progress will be handled by parent component
        });
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Card
      className={`transition-colors ${
        isDragOver
          ? 'border-primary bg-primary/5'
          : 'border-dashed border-muted-foreground/25'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between p-1 border-b border-dashed border-muted-foreground/25">
        <h3 className="text-lg font-medium p-2">{t('upload_zone')}</h3>
        <Button variant="ghost" size="icon" onClick={toggleCollapse}>
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      {!isCollapsed && (
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('upload_files')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('drop_files_here')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('maximum_file_size')}: {MAX_UPLOAD_SIZE_GB} GB ({MAX_UPLOAD_SIZE_MB} MB)
            </p>
          </div>

          <Button onClick={handleButtonClick}>
            <Upload className="h-4 w-4 mr-2" />
            {t('choose_files')}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </CardContent>
      )}
    </Card>
  );
}
