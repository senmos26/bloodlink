"use client";

import { Button } from "@/components/ui/button";
import { Frown } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors.global");

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
    // Display a user-friendly toast notification
    toast.error(t("toast.title"), {
      description: t("toast.description"),
      duration: 10000,
    });
  }, [error, t]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-12 text-center">
        <Frown className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-bold tracking-tight">{t("heading")}</h2>
        <p className="max-w-md text-muted-foreground">{t("description")}</p>
        <Button onClick={() => reset()} className="mt-4">
          {t("button")}
        </Button>
      </div>
    </div>
  );
}
