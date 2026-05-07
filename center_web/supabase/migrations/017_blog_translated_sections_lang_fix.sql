CREATE OR REPLACE FUNCTION public.get_blog_posts_translated(lang character varying DEFAULT 'fr'::character varying)
RETURNS TABLE (
  id uuid,
  slug character varying,
  title text,
  category character varying,
  date character varying,
  excerpt text,
  read_time character varying,
  image_url text,
  author_name character varying,
  author_role character varying,
  introduction text,
  sections jsonb,
  expert_note jsonb,
  conclusion text,
  tags text[],
  status character varying,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.slug,
    COALESCE(public.get_translation(b.title_i18n, lang), b.title) AS title,
    b.category,
    b.date,
    COALESCE(public.get_translation(b.excerpt_i18n, lang), b.excerpt) AS excerpt,
    b.read_time,
    b.image_url,
    b.author_name,
    b.author_role,
    COALESCE(public.get_translation(b.introduction_i18n, lang), b.introduction) AS introduction,
    CASE
      WHEN lang = 'fr' OR b.sections_i18n IS NULL OR b.sections_i18n = '[]'::jsonb THEN b.sections
      ELSE b.sections_i18n
    END AS sections,
    b.expert_note,
    COALESCE(public.get_translation(b.conclusion_i18n, lang), b.conclusion) AS conclusion,
    b.tags,
    b.status,
    b.created_at,
    b.updated_at
  FROM public.blog_posts b
  WHERE b.status = 'published'
  ORDER BY b.created_at DESC;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_blog_posts_translated(character varying) TO anon, authenticated;
