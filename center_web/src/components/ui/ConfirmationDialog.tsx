"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

type ConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  title: string;
  description: ReactNode;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonVariant?: "default" | "destructive";
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  title,
  description,
  confirmButtonText,
  cancelButtonText,
  confirmButtonVariant = "default",
}: ConfirmationDialogProps) {
  const t = useTranslations('common');
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[92vw] max-w-[520px] sm:max-w-lg p-4 sm:p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl sm:text-2xl font-bold text-gray-800 text-center">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm sm:text-base text-gray-600 pt-2 text-center">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="pt-4 gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isPending}>
            {cancelButtonText || t('actions.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            className={
              confirmButtonVariant === "destructive"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : ""
            }
          >
            {isPending ? t('actions.saving') : (confirmButtonText || t('actions.save'))}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

