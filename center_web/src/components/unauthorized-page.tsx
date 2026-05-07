"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function UnauthorizedPage() {
  const router = useRouter();
  const t = useTranslations('unauthorized');

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {t('title')}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-500">
            {t('message')}
          </p>
          <Button 
            onClick={handleGoHome}
            className="w-full"
          >
            <Home className="mr-2 h-4 w-4" />
            {t('goHome')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
