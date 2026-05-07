CREATE OR REPLACE FUNCTION public.is_backoffice_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles ap
    WHERE ap.id = (SELECT auth.uid())
  );
$function$;

CREATE OR REPLACE VIEW public.services_i18n
WITH (security_invoker = true) AS
SELECT
  id,
  pole_id,
  slug,
  ref,
  title,
  title_i18n,
  public.get_translation(title_i18n, 'fr') AS title_fr,
  public.get_translation(title_i18n, 'en') AS title_en,
  subtitle,
  subtitle_i18n,
  public.get_translation(subtitle_i18n, 'fr') AS subtitle_fr,
  public.get_translation(subtitle_i18n, 'en') AS subtitle_en,
  description,
  description_i18n,
  public.get_translation(description_i18n, 'fr') AS description_fr,
  public.get_translation(description_i18n, 'en') AS description_en,
  icon,
  brochure_url,
  standards,
  sort_order,
  status,
  created_at,
  updated_at
FROM public.services;

CREATE OR REPLACE VIEW public.references_i18n
WITH (security_invoker = true) AS
SELECT
  id,
  ref,
  slug,
  type,
  title,
  title_i18n,
  public.get_translation(title_i18n, 'fr') AS title_fr,
  public.get_translation(title_i18n, 'en') AS title_en,
  sector,
  sector_i18n,
  public.get_translation(sector_i18n, 'fr') AS sector_fr,
  public.get_translation(sector_i18n, 'en') AS sector_en,
  location,
  location_i18n,
  public.get_translation(location_i18n, 'fr') AS location_fr,
  public.get_translation(location_i18n, 'en') AS location_en,
  period,
  image_url,
  context,
  context_i18n,
  public.get_translation(context_i18n, 'fr') AS context_fr,
  public.get_translation(context_i18n, 'en') AS context_en,
  methodology,
  methodology_i18n,
  results_description,
  results_description_i18n,
  public.get_translation(results_description_i18n, 'fr') AS results_description_fr,
  public.get_translation(results_description_i18n, 'en') AS results_description_en,
  result_tags,
  stats,
  technologies,
  tags,
  status,
  sort_order,
  created_at,
  updated_at
FROM public."references";

CREATE OR REPLACE VIEW public.blog_posts_i18n
WITH (security_invoker = true) AS
SELECT
  id,
  slug,
  title,
  title_i18n,
  public.get_translation(title_i18n, 'fr') AS title_fr,
  public.get_translation(title_i18n, 'en') AS title_en,
  category,
  date,
  excerpt,
  excerpt_i18n,
  public.get_translation(excerpt_i18n, 'fr') AS excerpt_fr,
  public.get_translation(excerpt_i18n, 'en') AS excerpt_en,
  read_time,
  image_url,
  author_name,
  author_role,
  introduction,
  introduction_i18n,
  public.get_translation(introduction_i18n, 'fr') AS introduction_fr,
  public.get_translation(introduction_i18n, 'en') AS introduction_en,
  sections,
  sections_i18n,
  expert_note,
  conclusion,
  conclusion_i18n,
  public.get_translation(conclusion_i18n, 'fr') AS conclusion_fr,
  public.get_translation(conclusion_i18n, 'en') AS conclusion_en,
  tags,
  status,
  created_at,
  updated_at
FROM public.blog_posts;

CREATE OR REPLACE VIEW public.team_members_i18n
WITH (security_invoker = true) AS
SELECT
  id,
  role,
  role_i18n,
  public.get_translation(role_i18n, 'fr') AS role_fr,
  public.get_translation(role_i18n, 'en') AS role_en,
  spec,
  spec_i18n,
  public.get_translation(spec_i18n, 'fr') AS spec_fr,
  public.get_translation(spec_i18n, 'en') AS spec_en,
  description,
  description_i18n,
  public.get_translation(description_i18n, 'fr') AS description_fr,
  public.get_translation(description_i18n, 'en') AS description_en,
  image_url,
  sort_order,
  status,
  created_at,
  updated_at
FROM public.team_members;

CREATE OR REPLACE VIEW public.certifications_i18n
WITH (security_invoker = true) AS
SELECT
  id,
  code,
  name,
  name_i18n,
  public.get_translation(name_i18n, 'fr') AS name_fr,
  public.get_translation(name_i18n, 'en') AS name_en,
  description,
  description_i18n,
  public.get_translation(description_i18n, 'fr') AS description_fr,
  public.get_translation(description_i18n, 'en') AS description_en,
  status,
  icon,
  sort_order,
  created_at,
  updated_at
FROM public.certifications;

DROP POLICY IF EXISTS "read about timeline items" ON public.settings_about_timeline_items;
CREATE POLICY "read about timeline items"
ON public.settings_about_timeline_items
FOR SELECT
TO anon
USING (is_active = true);

DROP POLICY IF EXISTS "manage about timeline items" ON public.settings_about_timeline_items;
CREATE POLICY "manage about timeline items"
ON public.settings_about_timeline_items
FOR ALL
TO authenticated
USING ((SELECT public.is_backoffice_user()))
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS settings_icon_options_auth_all ON public.settings_icon_options;
CREATE POLICY settings_icon_options_auth_all
ON public.settings_icon_options
FOR ALL
TO authenticated
USING ((SELECT public.is_backoffice_user()))
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS settings_standard_options_auth_all ON public.settings_standard_options;
CREATE POLICY settings_standard_options_auth_all
ON public.settings_standard_options
FOR ALL
TO authenticated
USING ((SELECT public.is_backoffice_user()))
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS settings_tag_options_auth_all ON public.settings_tag_options;
CREATE POLICY settings_tag_options_auth_all
ON public.settings_tag_options
FOR ALL
TO authenticated
USING ((SELECT public.is_backoffice_user()))
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS settings_blog_category_options_auth_all ON public.settings_blog_category_options;
CREATE POLICY settings_blog_category_options_auth_all
ON public.settings_blog_category_options
FOR ALL
TO authenticated
USING ((SELECT public.is_backoffice_user()))
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS supported_languages_auth_select ON public.supported_languages;
DROP POLICY IF EXISTS supported_languages_auth_all ON public.supported_languages;
CREATE POLICY supported_languages_auth_all
ON public.supported_languages
FOR ALL
TO authenticated
USING ((SELECT public.is_backoffice_user()))
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS team_members_auth_select ON public.team_members;
CREATE POLICY team_members_auth_select
ON public.team_members
FOR SELECT
TO authenticated
USING ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS team_members_auth_insert ON public.team_members;
CREATE POLICY team_members_auth_insert
ON public.team_members
FOR INSERT
TO authenticated
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS team_members_auth_update ON public.team_members;
CREATE POLICY team_members_auth_update
ON public.team_members
FOR UPDATE
TO authenticated
USING ((SELECT public.is_backoffice_user()))
WITH CHECK ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS team_members_auth_delete ON public.team_members;
CREATE POLICY team_members_auth_delete
ON public.team_members
FOR DELETE
TO authenticated
USING ((SELECT public.is_backoffice_user()));

DROP POLICY IF EXISTS admin_profiles_auth_select ON public.admin_profiles;
CREATE POLICY admin_profiles_auth_select
ON public.admin_profiles
FOR SELECT
TO authenticated
USING (((SELECT auth.uid())) = id);

DROP POLICY IF EXISTS admin_profiles_auth_update ON public.admin_profiles;
CREATE POLICY admin_profiles_auth_update
ON public.admin_profiles
FOR UPDATE
TO authenticated
USING (((SELECT auth.uid())) = id)
WITH CHECK (((SELECT auth.uid())) = id);

DROP POLICY IF EXISTS admin_profiles_auth_insert ON public.admin_profiles;
CREATE POLICY admin_profiles_auth_insert
ON public.admin_profiles
FOR INSERT
TO authenticated
WITH CHECK (((SELECT auth.uid())) = id);

GRANT SELECT ON public.services_i18n TO anon, authenticated;
GRANT SELECT ON public.references_i18n TO anon, authenticated;
GRANT SELECT ON public.blog_posts_i18n TO anon, authenticated;
GRANT SELECT ON public.team_members_i18n TO anon, authenticated;
GRANT SELECT ON public.certifications_i18n TO anon, authenticated;
