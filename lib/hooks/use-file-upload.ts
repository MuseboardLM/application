"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export interface FileUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedUrl: string | null;
  fileName: string | null;
}

export interface FileUploadOptions {
  bucket?: string;
  folder?: string;
  maxSizeBytes?: number;
  allowedTypes?: string[];
  onProgress?: (progress: number) => void;
  onSuccess?: (url: string, fileName: string) => void;
  onError?: (error: string) => void;
}

const DEFAULT_OPTIONS: Required<FileUploadOptions> = {
  bucket: "muse-files",
  folder: "uploads",
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  onProgress: () => {},
  onSuccess: () => {},
  onError: () => {},
};

export function useFileUpload(options: FileUploadOptions = {}) {
  const [state, setState] = useState<FileUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    uploadedUrl: null,
    fileName: null,
  });

  const supabase = createClient();
  const config = { ...DEFAULT_OPTIONS, ...options };

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > config.maxSizeBytes) {
      return `File size must be less than ${config.maxSizeBytes / (1024 * 1024)}MB`;
    }

    // Check file type
    if (!config.allowedTypes.includes(file.type)) {
      return `File type not allowed. Allowed types: ${config.allowedTypes.join(", ")}`;
    }

    return null;
  }, [config.maxSizeBytes, config.allowedTypes]);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }));
      toast.error(validationError);
      config.onError(validationError);
      return null;
    }

    // Reset state
    setState({
      isUploading: true,
      progress: 0,
      error: null,
      uploadedUrl: null,
      fileName: null,
    });

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${config.folder}/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(config.bucket)
        .upload(filePath, file, {
          upsert: false,
          cacheControl: "3600",
        });

      if (error) {
        throw new Error(error.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(config.bucket)
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update state
      setState({
        isUploading: false,
        progress: 100,
        error: null,
        uploadedUrl: publicUrl,
        fileName: filePath,
      });

      toast.success("File uploaded successfully!");
      config.onSuccess(publicUrl, filePath);
      
      return filePath;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      
      setState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
        uploadedUrl: null,
        fileName: null,
      });

      toast.error(errorMessage);
      config.onError(errorMessage);
      return null;
    }
  }, [supabase, config, validateFile]);

  const uploadMultipleFiles = useCallback(async (files: File[]): Promise<string[]> => {
    const uploadedFiles: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadedPath = await uploadFile(file);
      
      if (uploadedPath) {
        uploadedFiles.push(uploadedPath);
      }
      
      // Update progress for multiple files
      const progress = ((i + 1) / files.length) * 100;
      setState(prev => ({ ...prev, progress }));
      config.onProgress(progress);
    }
    
    return uploadedFiles;
  }, [uploadFile, config]);

  const deleteFile = useCallback(async (filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(config.bucket)
        .remove([filePath]);

      if (error) {
        throw new Error(error.message);
      }

      toast.success("File deleted successfully!");
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Delete failed";
      toast.error(errorMessage);
      return false;
    }
  }, [supabase, config.bucket]);

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      uploadedUrl: null,
      fileName: null,
    });
  }, []);

  return {
    ...state,
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    reset,
    validateFile,
  };
}