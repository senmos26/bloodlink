/**
 * @file LoginPage: The main entry point for the authentication screen.
 *
 * @version 5.0.0 (Final Architecture)
 * @author Principal Engineer
 * @description
 *   - The page's only responsibility is to center the self-contained login form.
 *   - All layout logic (logo, footer) has been moved into the LoginForm component
 *     for a robust, professional, and maintainable structure.
 */
import { Suspense } from "react";
import { LoginForm } from "@/features/auth";

export default function LoginPage() {

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center bg-light text-slate-900 px-4">

      {/* Main Container: Centered */}
      <section className="relative z-10 flex w-full max-w-md flex-col items-center justify-center py-12">
        <div className="w-full space-y-6">

          <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-200">
            <Suspense
              fallback={
                <div className="flex w-full flex-col gap-4 animate-pulse">
                  <div className="h-4 w-28 rounded-full bg-slate-200" />
                  <div className="h-10 rounded-xl bg-slate-100" />
                  <div className="h-10 rounded-xl bg-slate-100" />
                  <div className="h-10 rounded-xl bg-slate-100" />
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </section>

    </main>
  );
}
