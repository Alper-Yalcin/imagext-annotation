import React, { useState, useRef } from "react";
import { Upload, FolderPlus, ImagePlus } from "lucide-react";
import { ImageItem } from "../../types/image";
import { fileToDataUrl, getImageSize, isSupportedImageFile } from "../../utils/image";
import { createId } from "../../utils/id";
import { useToast } from "../../context/ToastContext";
import { Button } from "../ui/Button";

interface ImageUploaderProps {
  projectId: string;
  existingImages: ImageItem[];
  onImagesUploaded: (images: ImageItem[]) => void;
}

export function ImageUploader({ projectId, existingImages, onImagesUploaded }: ImageUploaderProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
  };

  const processFiles = async (files: File[]) => {
    setIsUploading(true);

    const validFiles = files.filter(isSupportedImageFile);
    const skippedNonImages = files.length - validFiles.length;

    if (validFiles.length === 0) {
      showToast({ type: "error", title: "Upload Failed", message: "No supported images found in selected folder." });
      setIsUploading(false);
      
      // Reset inputs
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (folderInputRef.current) folderInputRef.current.value = "";
      return;
    }

    const newImages: ImageItem[] = [];
    let duplicateCount = 0;

    for (const file of validFiles) {
      const relativePath = file.webkitRelativePath || undefined;
      
      // Duplicate check: relativePath or name + projectId
      const isDuplicate = existingImages.some(img => {
        if (relativePath) {
          return img.relativePath === relativePath;
        }
        return img.name === file.name;
      });

      if (isDuplicate) {
        duplicateCount++;
        continue;
      }

      try {
        const dataUrl = await fileToDataUrl(file);
        const { width, height } = await getImageSize(dataUrl);

        newImages.push({
          id: createId("img"),
          projectId,
          name: file.name,
          relativePath,
          dataUrl,
          width,
          height,
          status: "unlabeled",
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Failed to process image", file.name, err);
      }
    }

    if (newImages.length > 0) {
      onImagesUploaded(newImages);
      let successMsg = `Successfully added ${newImages.length} images.`;
      if (skippedNonImages > 0) {
        successMsg = `Images uploaded successfully. ${skippedNonImages} files skipped because they were not supported images.`;
      }
      showToast({ type: "success", title: "Upload Complete", message: successMsg });
    }

    if (duplicateCount > 0) {
      showToast({ type: "info", title: "Duplicates skipped", message: `Skipped ${duplicateCount} duplicate images.` });
    }

    setIsUploading(false);
    
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFolderClick = () => {
    folderInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div 
        className={`bg-zinc-800/50 rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center text-center transition-colors
          ${isHovering ? "border-yellow-500 bg-yellow-500/5" : "border-zinc-700 hover:border-zinc-500"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden" 
        />
        <input 
          type="file" 
          ref={folderInputRef}
          onChange={handleFileChange}
          multiple
          webkitdirectory="true"
          directory="true"
          className="hidden" 
        />
        
        <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-zinc-400">
          <Upload className={`w-8 h-8 ${isUploading ? "animate-bounce text-yellow-500" : ""}`} />
        </div>
        
        <h3 className="text-lg font-semibold text-white mb-2">
          {isUploading ? "Processing Images..." : "Upload Dataset"}
        </h3>
        <p className="text-zinc-400 max-w-sm text-sm mb-6">
          Drag and drop files/folders here, or use the buttons below. Supported formats: JPG, PNG, WEBP.
        </p>

        <div className="flex items-center gap-4">
          <Button 
            variant="secondary" 
            onClick={handleFileClick} 
            disabled={isUploading}
            leftIcon={<ImagePlus className="w-4 h-4" />}
          >
            Select Images
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleFolderClick} 
            disabled={isUploading}
            leftIcon={<FolderPlus className="w-4 h-4" />}
          >
            Select Folder
          </Button>
        </div>
      </div>
    </div>
  );
}
