CREATE OR REPLACE FUNCTION public.create_service(
  p_pole_id uuid,
  p_slug character varying,
  p_ref character varying,
  p_title character varying,
  p_subtitle character varying,
  p_description text,
  p_icon character varying DEFAULT NULL,
  p_brochure_url text DEFAULT NULL,
  p_standards text[] DEFAULT NULL,
  p_sort_order integer DEFAULT 0,
  p_status character varying DEFAULT 'active'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.services (
    pole_id,
    slug,
    ref,
    title,
    title_i18n,
    subtitle,
    subtitle_i18n,
    description,
    description_i18n,
    icon,
    brochure_url,
    standards,
    sort_order,
    status
  )
  VALUES (
    p_pole_id,
    p_slug,
    p_ref,
    p_title,
    public.text_to_i18n(p_title, 'fr'),
    p_subtitle,
    public.text_to_i18n(p_subtitle, 'fr'),
    p_description,
    public.text_to_i18n(p_description, 'fr'),
    p_icon,
    p_brochure_url,
    COALESCE(p_standards, '{}'),
    p_sort_order,
    p_status
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_service(
  p_id uuid,
  p_pole_id uuid DEFAULT NULL,
  p_slug character varying DEFAULT NULL,
  p_ref character varying DEFAULT NULL,
  p_title character varying DEFAULT NULL,
  p_subtitle character varying DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_icon character varying DEFAULT NULL,
  p_brochure_url text DEFAULT NULL,
  p_standards text[] DEFAULT NULL,
  p_sort_order integer DEFAULT NULL,
  p_status character varying DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.services
  SET pole_id = COALESCE(p_pole_id, pole_id),
      slug = COALESCE(p_slug, slug),
      ref = COALESCE(p_ref, ref),
      title = COALESCE(p_title, title),
      title_i18n = CASE
        WHEN p_title IS NULL THEN title_i18n
        ELSE public.set_translation(COALESCE(title_i18n, '{}'::jsonb), 'fr', p_title)
      END,
      subtitle = COALESCE(p_subtitle, subtitle),
      subtitle_i18n = CASE
        WHEN p_subtitle IS NULL THEN subtitle_i18n
        ELSE public.set_translation(COALESCE(subtitle_i18n, '{}'::jsonb), 'fr', p_subtitle)
      END,
      description = COALESCE(p_description, description),
      description_i18n = CASE
        WHEN p_description IS NULL THEN description_i18n
        ELSE public.set_translation(COALESCE(description_i18n, '{}'::jsonb), 'fr', p_description)
      END,
      icon = COALESCE(p_icon, icon),
      brochure_url = COALESCE(p_brochure_url, brochure_url),
      standards = COALESCE(p_standards, standards),
      sort_order = COALESCE(p_sort_order, sort_order),
      status = COALESCE(p_status, status),
      updated_at = NOW()
  WHERE id = p_id;

  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_service_by_id(p_id uuid)
RETURNS TABLE(
  id uuid,
  pole_id uuid,
  slug character varying,
  ref character varying,
  title character varying,
  subtitle character varying,
  description text,
  icon character varying,
  brochure_url text,
  standards text[],
  sort_order integer,
  status character varying,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.pole_id,
    s.slug,
    s.ref,
    COALESCE(NULLIF(public.get_translation(s.title_i18n, 'fr'), ''), s.title)::varchar,
    COALESCE(NULLIF(public.get_translation(s.subtitle_i18n, 'fr'), ''), s.subtitle)::varchar,
    COALESCE(NULLIF(public.get_translation(s.description_i18n, 'fr'), ''), s.description),
    s.icon,
    s.brochure_url,
    s.standards,
    s.sort_order,
    s.status,
    s.created_at,
    s.updated_at
  FROM public.services s
  WHERE s.id = p_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_service_by_slug(
  p_slug character varying,
  p_include_inactive boolean DEFAULT false
)
RETURNS TABLE(
  id uuid,
  pole_id uuid,
  slug character varying,
  ref character varying,
  title character varying,
  subtitle character varying,
  description text,
  icon character varying,
  brochure_url text,
  standards text[],
  sort_order integer,
  status character varying,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.pole_id,
    s.slug,
    s.ref,
    COALESCE(NULLIF(public.get_translation(s.title_i18n, 'fr'), ''), s.title)::varchar,
    COALESCE(NULLIF(public.get_translation(s.subtitle_i18n, 'fr'), ''), s.subtitle)::varchar,
    COALESCE(NULLIF(public.get_translation(s.description_i18n, 'fr'), ''), s.description),
    s.icon,
    s.brochure_url,
    s.standards,
    s.sort_order,
    s.status,
    s.created_at,
    s.updated_at
  FROM public.services s
  LEFT JOIN public.service_poles sp ON sp.id = s.pole_id
  WHERE s.slug = p_slug
    AND (
      p_include_inactive
      OR (
        s.status = 'active'
        AND (s.pole_id IS NULL OR sp.status = 'active')
      )
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_services(
  p_status character varying DEFAULT NULL,
  p_pole_id uuid DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  pole_id uuid,
  slug character varying,
  ref character varying,
  title character varying,
  subtitle character varying,
  description text,
  icon character varying,
  brochure_url text,
  standards text[],
  sort_order integer,
  status character varying,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.pole_id,
    s.slug,
    s.ref,
    COALESCE(NULLIF(public.get_translation(s.title_i18n, 'fr'), ''), s.title)::varchar,
    COALESCE(NULLIF(public.get_translation(s.subtitle_i18n, 'fr'), ''), s.subtitle)::varchar,
    COALESCE(NULLIF(public.get_translation(s.description_i18n, 'fr'), ''), s.description),
    s.icon,
    s.brochure_url,
    s.standards,
    s.sort_order,
    s.status,
    s.created_at,
    s.updated_at
  FROM public.services s
  WHERE (p_status IS NULL OR s.status = p_status)
    AND (p_pole_id IS NULL OR s.pole_id = p_pole_id)
    AND (
      p_search IS NULL OR 
      COALESCE(NULLIF(public.get_translation(s.title_i18n, 'fr'), ''), s.title) ILIKE '%' || p_search || '%' OR
      COALESCE(NULLIF(public.get_translation(s.subtitle_i18n, 'fr'), ''), s.subtitle) ILIKE '%' || p_search || '%' OR
      COALESCE(NULLIF(public.get_translation(s.description_i18n, 'fr'), ''), s.description) ILIKE '%' || p_search || '%'
    )
  ORDER BY s.sort_order ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_active_services()
RETURNS TABLE(
  id uuid,
  pole_id uuid,
  slug character varying,
  ref character varying,
  title character varying,
  subtitle character varying,
  description text,
  icon character varying,
  brochure_url text,
  standards text[],
  sort_order integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.pole_id,
    s.slug,
    s.ref,
    COALESCE(NULLIF(public.get_translation(s.title_i18n, 'fr'), ''), s.title)::varchar,
    COALESCE(NULLIF(public.get_translation(s.subtitle_i18n, 'fr'), ''), s.subtitle)::varchar,
    COALESCE(NULLIF(public.get_translation(s.description_i18n, 'fr'), ''), s.description),
    s.icon,
    s.brochure_url,
    s.standards,
    s.sort_order
  FROM public.services s
  LEFT JOIN public.service_poles sp ON sp.id = s.pole_id
  WHERE s.status = 'active'
    AND (s.pole_id IS NULL OR sp.status = 'active')
  ORDER BY s.sort_order ASC;
END;
$function$;
