DO $function$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS identity_args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND pg_get_userbyid(p.proowner) = 'postgres'
      AND NOT EXISTS (
        SELECT 1
        FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS cfg
        WHERE cfg LIKE 'search_path=%'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public',
      fn.schema_name,
      fn.function_name,
      fn.identity_args
    );
  END LOOP;
END;
$function$;

DROP POLICY IF EXISTS contacts_auth_select ON public.contacts;
CREATE POLICY contacts_auth_select
ON public.contacts
FOR SELECT
TO authenticated
USING ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS contacts_auth_update ON public.contacts;
CREATE POLICY contacts_auth_update
ON public.contacts
FOR UPDATE
TO authenticated
USING ((SELECT public.is_backoffice_user()))
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS contacts_auth_delete ON public.contacts;
CREATE POLICY contacts_auth_delete
ON public.contacts
FOR DELETE
TO authenticated
USING ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS blog_posts_auth_select ON public.blog_posts;
CREATE POLICY blog_posts_auth_select
ON public.blog_posts
FOR SELECT
TO authenticated
USING ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS blog_posts_auth_insert ON public.blog_posts;
CREATE POLICY blog_posts_auth_insert
ON public.blog_posts
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS blog_posts_auth_update ON public.blog_posts;
CREATE POLICY blog_posts_auth_update
ON public.blog_posts
FOR UPDATE
TO authenticated
USING ((SELECT public.is_backoffice_user()))
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS blog_posts_auth_delete ON public.blog_posts;
CREATE POLICY blog_posts_auth_delete
ON public.blog_posts
FOR DELETE
TO authenticated
USING ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS blog_comments_auth_select ON public.blog_comments;
CREATE POLICY blog_comments_auth_select
ON public.blog_comments
FOR SELECT
TO authenticated
USING ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS blog_comments_auth_update ON public.blog_comments;
CREATE POLICY blog_comments_auth_update
ON public.blog_comments
FOR UPDATE
TO authenticated
USING ((SELECT public.is_backoffice_user()))
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS blog_comments_auth_delete ON public.blog_comments;
CREATE POLICY blog_comments_auth_delete
ON public.blog_comments
FOR DELETE
TO authenticated
USING ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS service_poles_auth_select ON public.service_poles;
CREATE POLICY service_poles_auth_select
ON public.service_poles
FOR SELECT
TO authenticated
USING ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS service_poles_auth_insert ON public.service_poles;
CREATE POLICY service_poles_auth_insert
ON public.service_poles
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS service_poles_auth_update ON public.service_poles;
CREATE POLICY service_poles_auth_update
ON public.service_poles
FOR UPDATE
TO authenticated
USING ((SELECT public.is_backoffice_user()))
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS service_poles_auth_delete ON public.service_poles;
CREATE POLICY service_poles_auth_delete
ON public.service_poles
FOR DELETE
TO authenticated
USING ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS services_auth_select ON public.services;
CREATE POLICY services_auth_select
ON public.services
FOR SELECT
TO authenticated
USING ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS services_auth_insert ON public.services;
CREATE POLICY services_auth_insert
ON public.services
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS services_auth_update ON public.services;
CREATE POLICY services_auth_update
ON public.services
FOR UPDATE
TO authenticated
USING ((SELECT public.is_backoffice_user()))
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS services_auth_delete ON public.services;
CREATE POLICY services_auth_delete
ON public.services
FOR DELETE
TO authenticated
USING ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS service_sections_auth_select ON public.service_sections;
CREATE POLICY service_sections_auth_select
ON public.service_sections
FOR SELECT
TO authenticated
USING ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS service_sections_auth_insert ON public.service_sections;
CREATE POLICY service_sections_auth_insert
ON public.service_sections
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS service_sections_auth_update ON public.service_sections;
CREATE POLICY service_sections_auth_update
ON public.service_sections
FOR UPDATE
TO authenticated
USING ((SELECT public.is_backoffice_user()))
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS service_sections_auth_delete ON public.service_sections;
CREATE POLICY service_sections_auth_delete
ON public.service_sections
FOR DELETE
TO authenticated
USING ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS references_auth_select ON public."references";
CREATE POLICY references_auth_select
ON public."references"
FOR SELECT
TO authenticated
USING ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS references_auth_insert ON public."references";
CREATE POLICY references_auth_insert
ON public."references"
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS references_auth_update ON public."references";
CREATE POLICY references_auth_update
ON public."references"
FOR UPDATE
TO authenticated
USING ((SELECT public.is_backoffice_user()))
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS references_auth_delete ON public."references";
CREATE POLICY references_auth_delete
ON public."references"
FOR DELETE
TO authenticated
USING ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS certifications_auth_select ON public.certifications;
CREATE POLICY certifications_auth_select
ON public.certifications
FOR SELECT
TO authenticated
USING ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS certifications_auth_insert ON public.certifications;
CREATE POLICY certifications_auth_insert
ON public.certifications
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS certifications_auth_update ON public.certifications;
CREATE POLICY certifications_auth_update
ON public.certifications
FOR UPDATE
TO authenticated
USING ((SELECT public.is_backoffice_user()))
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS certifications_auth_delete ON public.certifications;
CREATE POLICY certifications_auth_delete
ON public.certifications
FOR DELETE
TO authenticated
USING ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS leads_auth_all ON public.leads;
CREATE POLICY leads_auth_all
ON public.leads
FOR ALL
TO authenticated
USING ((SELECT public.is_backoffice_user()))
WITH CHECK ((SELECT public.is_backoffice_user()));
