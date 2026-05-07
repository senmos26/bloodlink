"use client";

import { useState, useRef, DragEvent } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, X, Link as LinkIcon, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/shared/lib/supabase/browser";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from "next/image";

interface ImageUploadProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  required?: boolean;
  folder?: string; // ex: "events", "blog"
}

const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET ?? "images";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ImageUpload({
  label,
  value,
  onChange,
  required = false,
  folder = "blog",
}: ImageUploadProps) {
  const [uploadMode, setUploadMode] = useState<"url" | "file">("url");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner un fichier image valide");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Le fichier est trop volumineux. Taille maximale : 10MB");
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createSupabaseBrowserClient();

      const fileExt = file.name.split(".").pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 15)
        }.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError || !uploadData) {
        console.error("[ImageUpload] Erreur upload:", uploadError);
        toast.error(
          `Erreur lors de l'upload : ${uploadError?.message ?? "inconnue"}`
        );
        setIsUploading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(uploadData.path);

      onChange(publicUrl);
      toast.success("Image uploadée avec succès !");
      setIsUploading(false);
    } catch (error) {
      console.error("[ImageUpload] Exception lors de l'upload:", error);
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(`Erreur lors de l'upload : ${message}`);
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFileUpload(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFileUpload(file);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value || null);
  };

  const clearImage = async () => {
    if (value && value.includes(`storage/v1/object/public/${BUCKET_NAME}/`)) {
      try {
        const supabase = createSupabaseBrowserClient();
        const urlParts = value.split(`/${BUCKET_NAME}/`);
        if (urlParts.length > 1) {
          const filePath = urlParts[1].split("?")[0];
          const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([filePath]);

          if (error) {
            console.error("[ImageUpload] Erreur lors de la suppression:", error);
          }
        }
      } catch (error) {
        console.error("[ImageUpload] Exception lors de la suppression:", error);
      }
    }

    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={uploadMode === "url" ? "default" : "outline"}
          size="sm"
          onClick={() => setUploadMode("url")}
        >
          <LinkIcon className="mr-2 h-4 w-4" />
          Lien URL
        </Button>
        <Button
          type="button"
          variant={uploadMode === "file" ? "default" : "outline"}
          size="sm"
          onClick={() => setUploadMode("file")}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload fichier
        </Button>
      </div>

      {value ? (
        <>
          <div
            className="relative group cursor-zoom-in"
            onClick={() => setIsPreviewOpen(true)}
          >
            <Image
              src={value}
              alt="Preview"
              width={400}
              height={192}
              className="w-full h-48 object-cover rounded-lg border"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-lg flex items-center justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void clearImage();
                }}
                className="opacity-0 group-hover:opacity-100 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all transform scale-90 group-hover:scale-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-w-3xl border-none bg-black/90 p-0 shadow-2xl">
              <div className="relative w-full aspect-[4/3] md:aspect-[16/9]">
                <Image
                  src={value}
                  alt="Aperçu de l'image"
                  fill
                  className="absolute inset-0 w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : uploadMode === "url" ? (
        <Input
          type="url"
          value={value ?? ""}
          onChange={handleUrlChange}
          placeholder="https://example.com/image.jpg"
          required={required}
        />
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg transition-all duration-200 ease-in-out ${isUploading
            ? "border-gray-300 bg-gray-50 cursor-wait"
            : isDragging
              ? "border-primary bg-primary/10 scale-[1.02] cursor-pointer"
              : "border-gray-300 hover:border-cyan-400 hover:bg-cyan-50 cursor-pointer"
            }`}
        >
          <div className="flex flex-col items-center justify-center pointer-events-none">
            {isUploading ? (
              <>
                <Loader2 className="h-12 w-12 text-primary mb-3 animate-spin" />
                <p className="text-base text-cyan-700 font-bold">Upload en cours...</p>
                <p className="text-xs text-gray-500 mt-1">Veuillez patienter</p>
              </>
            ) : isDragging ? (
              <>
                <ImageIcon className="h-12 w-12 text-primary mb-3 animate-bounce" />
                <p className="text-base text-cyan-700 font-bold">
                  Déposez l&apos;image ici
                </p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 font-semibold mb-1">
                  Glissez-déposez une image ou cliquez pour parcourir
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, JPEG jusqu&apos;à 10MB
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileInputChange}
            required={required && !value}
          />
        </div>
      )}
    </div>
  );
}
