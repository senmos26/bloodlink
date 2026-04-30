declare module "jsr:@supabase/supabase-js@2" {
  export function createClient(url: string, key: string, options?: unknown): any;
}

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: {
    get(name: string): string | undefined;
  };
};
