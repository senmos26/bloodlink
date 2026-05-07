CREATE OR REPLACE FUNCTION public.get_service_sections_by_service_id(p_service_id uuid)
RETURNS TABLE(
  id uuid,
  service_id uuid,
  title character varying,
  content text[],
  sort_order integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ss.id,
    ss.service_id,
    COALESCE(NULLIF(public.get_translation(ss.title_i18n, 'fr'), ''), ss.title)::varchar,
    CASE
      WHEN ss.content_i18n IS NULL OR ss.content_i18n = '[]'::jsonb THEN ss.content
      ELSE ARRAY(
        SELECT COALESCE(NULLIF(public.get_translation(content_item, 'fr'), ''), '')
        FROM jsonb_array_elements(ss.content_i18n) AS content_item
      )
    END,
    ss.sort_order
  FROM public.service_sections ss
  WHERE ss.service_id = p_service_id
  ORDER BY ss.sort_order ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.replace_service_sections(
  p_service_id uuid,
  p_sections jsonb DEFAULT '[]'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  DELETE FROM public.service_sections
  WHERE service_id = p_service_id;

  INSERT INTO public.service_sections (
    service_id,
    title,
    title_i18n,
    content,
    content_i18n,
    sort_order
  )
  SELECT
    p_service_id,
    normalized.title,
    public.text_to_i18n(normalized.title, 'fr'),
    normalized.content,
    public.text_array_to_i18n(normalized.content, 'fr'),
    normalized.sort_order
  FROM (
    SELECT
      NULLIF(BTRIM(section_item->>'title'), '') AS title,
      COALESCE(
        ARRAY(
          SELECT BTRIM(content_item)
          FROM jsonb_array_elements_text(COALESCE(section_item->'content', '[]'::jsonb)) AS content_item
          WHERE BTRIM(content_item) <> ''
        ),
        ARRAY[]::text[]
      ) AS content,
      ordinality - 1 AS sort_order
    FROM jsonb_array_elements(COALESCE(p_sections, '[]'::jsonb)) WITH ORDINALITY AS sections(section_item, ordinality)
  ) AS normalized
  WHERE normalized.title IS NOT NULL
    AND array_length(normalized.content, 1) IS NOT NULL;

  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_service_with_sections_translated(
  p_slug character varying,
  p_lang character varying DEFAULT 'fr'::character varying,
  p_include_inactive boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $function$
DECLARE
  v_service_id uuid;
  v_result jsonb;
BEGIN
  SELECT s.id INTO v_service_id
  FROM public.services s
  WHERE s.slug = p_slug
    AND (p_include_inactive OR s.status = 'active');

  IF v_service_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'service', (
      SELECT jsonb_build_object(
        'id', s.id,
        'pole_id', s.pole_id,
        'slug', s.slug,
        'ref', s.ref,
        'title', COALESCE(NULLIF(public.get_translation(s.title_i18n, p_lang), ''), s.title),
        'subtitle', COALESCE(NULLIF(public.get_translation(s.subtitle_i18n, p_lang), ''), s.subtitle),
        'description', COALESCE(NULLIF(public.get_translation(s.description_i18n, p_lang), ''), s.description),
        'icon', s.icon,
        'brochure_url', s.brochure_url,
        'standards', s.standards,
        'sort_order', s.sort_order,
        'status', s.status,
        'created_at', s.created_at,
        'updated_at', s.updated_at
      )
      FROM public.services s
      WHERE s.id = v_service_id
    ),
    'sections', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', ss.id,
            'service_id', ss.service_id,
            'title', COALESCE(NULLIF(public.get_translation(ss.title_i18n, p_lang), ''), ss.title),
            'content', CASE
              WHEN ss.content_i18n IS NULL OR ss.content_i18n = '[]'::jsonb THEN to_jsonb(ss.content)
              ELSE to_jsonb(ARRAY(
                SELECT COALESCE(NULLIF(public.get_translation(content_item, p_lang), ''), '')
                FROM jsonb_array_elements(ss.content_i18n) AS content_item
              ))
            END,
            'sort_order', ss.sort_order,
            'created_at', ss.created_at
          )
          ORDER BY ss.sort_order ASC
        )
        FROM public.service_sections ss
        WHERE ss.service_id = v_service_id
      ),
      '[]'::jsonb
    )
  ) INTO v_result;

  RETURN v_result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_service_sections_by_service_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.replace_service_sections(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_service_with_sections_translated(character varying, character varying, boolean) TO anon, authenticated;
