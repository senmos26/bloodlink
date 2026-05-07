CREATE OR REPLACE FUNCTION public.get_services_with_features(lang character varying DEFAULT 'fr'::character varying)
RETURNS TABLE (
  id uuid,
  pole_id uuid,
  slug character varying,
  ref character varying,
  title text,
  subtitle text,
  description text,
  icon character varying,
  brochure_url text,
  standards text[],
  sort_order integer,
  status character varying,
  features text[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.pole_id,
    s.slug,
    s.ref,
    COALESCE(NULLIF(public.get_translation(s.title_i18n, lang), ''), s.title)::text AS title,
    COALESCE(NULLIF(public.get_translation(s.subtitle_i18n, lang), ''), s.subtitle)::text AS subtitle,
    COALESCE(NULLIF(public.get_translation(s.description_i18n, lang), ''), s.description)::text AS description,
    s.icon,
    s.brochure_url,
    s.standards,
    s.sort_order,
    s.status,
    COALESCE(
      (
        SELECT CASE
          WHEN ss.content_i18n IS NULL OR ss.content_i18n = '[]'::jsonb THEN ss.content
          ELSE ARRAY(
            SELECT COALESCE(NULLIF(public.get_translation(content_item, lang), ''), '')
            FROM jsonb_array_elements(ss.content_i18n) AS content_item
          )
        END
        FROM public.service_sections ss
        WHERE ss.service_id = s.id
        ORDER BY ss.sort_order ASC
        LIMIT 1
      ),
      '{}'::text[]
    ) AS features
  FROM public.services s
  WHERE s.status = 'active'
  ORDER BY s.sort_order;
END;
$function$;

UPDATE public.services
SET title_i18n = public.set_translation(COALESCE(title_i18n, '{}'::jsonb), 'fr', title),
    subtitle_i18n = CASE
      WHEN subtitle IS NULL THEN subtitle_i18n
      ELSE public.set_translation(COALESCE(subtitle_i18n, '{}'::jsonb), 'fr', subtitle)
    END,
    description_i18n = public.set_translation(COALESCE(description_i18n, '{}'::jsonb), 'fr', description);

GRANT EXECUTE ON FUNCTION public.get_services_with_features(character varying) TO anon, authenticated;
