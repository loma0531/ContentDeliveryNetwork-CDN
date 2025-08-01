'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export interface UploadingFile {
  id: string; // Add unique ID for each upload
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
}

interface UploadProgressPanelProps {
  uploadingFiles: UploadingFile[];
  onClearCompleted?: () => void;
}

export function UploadProgressPanel({ uploadingFiles, onClearCompleted }: UploadProgressPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useTranslation();

  if (uploadingFiles.length === 0) return null;

  const activeUploads = uploadingFiles.filter(f => f.status === 'uploading' || f.status === 'pending').length;
  const completedUploads = uploadingFiles.filter(f => f.status === 'completed').length;
  const failedUploads = uploadingFiles.filter(f => f.status === 'failed').length;

  return (
    <Card className="fixed bottom-4 right-4 w-96 shadow-lg z-50">
      <div 
        className="flex items-center justify-between p-3 border-b cursor-pointer bg-muted/50"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center space-x-2">
          <h3 className="font-medium">
            {activeUploads > 0 
              ? t('uploading_files', { count: activeUploads })
              : t('uploads_complete')}
          </h3>
          {(completedUploads > 0 || failedUploads > 0) && (
            <span className="text-sm text-muted-foreground">
              ({completedUploads} {t('completed')}, {failedUploads} {t('failed')})
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {onClearCompleted && completedUploads > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClearCompleted();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="max-h-[300px] overflow-y-auto p-3 space-y-2">
          {uploadingFiles.map((file) => (
            <div
              key={file.id}
              className="text-sm bg-muted/50 rounded px-3 py-2"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="truncate">{file.name}</span>
                <span className="ml-2 text-xs whitespace-nowrap">
                  {file.status === 'failed' 
                    ? t('failed')
                    : file.status === 'completed'
                    ? t('completed')
                    : file.status === 'pending'
                    ? t('pending')
                    : `${Math.round(file.progress)}%`
                  }
                </span>
              </div>
              <div className="w-full h-1 bg-muted-foreground/25 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 rounded-full ${
                    file.status === 'failed'
                      ? 'bg-destructive'
                      : file.status === 'completed'
                      ? 'bg-green-500'
                      : 'bg-primary'
                  }`}
                  style={{ 
                    width: `${file.status === 'failed' ? 100 : file.progress}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
