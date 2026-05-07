CREATE OR REPLACE FUNCTION public.create_blog_post(
  p_slug character varying,
  p_title character varying,
  p_category character varying,
  p_date character varying,
  p_excerpt text,
  p_read_time character varying,
  p_image_url text,
  p_author_name character varying,
  p_author_role character varying,
  p_introduction text,
  p_sections jsonb,
  p_expert_note jsonb,
  p_conclusion text,
  p_tags text[],
  p_status character varying DEFAULT 'draft'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.blog_posts (
    slug,
    title,
    title_i18n,
    category,
    date,
    excerpt,
    excerpt_i18n,
    read_time,
    image_url,
    author_name,
    author_role,
    introduction,
    introduction_i18n,
    sections,
    expert_note,
    conclusion,
    conclusion_i18n,
    tags,
    status
  )
  VALUES (
    p_slug,
    p_title,
    public.text_to_i18n(p_title, 'fr'),
    p_category,
    p_date,
    p_excerpt,
    public.text_to_i18n(p_excerpt, 'fr'),
    p_read_time,
    p_image_url,
    p_author_name,
    p_author_role,
    p_introduction,
    public.text_to_i18n(p_introduction, 'fr'),
    COALESCE(p_sections, '[]'::jsonb),
    p_expert_note,
    p_conclusion,
    public.text_to_i18n(p_conclusion, 'fr'),
    COALESCE(p_tags, '{}'::text[]),
    p_status
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_blog_post(
  p_id uuid,
  p_slug character varying DEFAULT NULL,
  p_title character varying DEFAULT NULL,
  p_category character varying DEFAULT NULL,
  p_date character varying DEFAULT NULL,
  p_excerpt text DEFAULT NULL,
  p_read_time character varying DEFAULT NULL,
  p_image_url text DEFAULT NULL,
  p_author_name character varying DEFAULT NULL,
  p_author_role character varying DEFAULT NULL,
  p_introduction text DEFAULT NULL,
  p_sections jsonb DEFAULT NULL,
  p_expert_note jsonb DEFAULT NULL,
  p_conclusion text DEFAULT NULL,
  p_tags text[] DEFAULT NULL,
  p_status character varying DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.blog_posts
  SET slug = COALESCE(p_slug, slug),
      title = COALESCE(p_title, title),
      title_i18n = CASE
        WHEN p_title IS NULL THEN title_i18n
        ELSE public.set_translation(COALESCE(title_i18n, '{}'::jsonb), 'fr', p_title)
      END,
      category = COALESCE(p_category, category),
      date = COALESCE(p_date, date),
      excerpt = COALESCE(p_excerpt, excerpt),
      excerpt_i18n = CASE
        WHEN p_excerpt IS NULL THEN excerpt_i18n
        ELSE public.set_translation(COALESCE(excerpt_i18n, '{}'::jsonb), 'fr', p_excerpt)
      END,
      read_time = COALESCE(p_read_time, read_time),
      image_url = COALESCE(p_image_url, image_url),
      author_name = COALESCE(p_author_name, author_name),
      author_role = COALESCE(p_author_role, author_role),
      introduction = COALESCE(p_introduction, introduction),
      introduction_i18n = CASE
        WHEN p_introduction IS NULL THEN introduction_i18n
        ELSE public.set_translation(COALESCE(introduction_i18n, '{}'::jsonb), 'fr', p_introduction)
      END,
      sections = COALESCE(p_sections, sections),
      expert_note = COALESCE(p_expert_note, expert_note),
      conclusion = COALESCE(p_conclusion, conclusion),
      conclusion_i18n = CASE
        WHEN p_conclusion IS NULL THEN conclusion_i18n
        ELSE public.set_translation(COALESCE(conclusion_i18n, '{}'::jsonb), 'fr', p_conclusion)
      END,
      tags = COALESCE(p_tags, tags),
      status = COALESCE(p_status, status),
      updated_at = NOW()
  WHERE id = p_id;

  RETURN FOUND;
END;
$function$;

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
SET search_path = public
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
SET search_path = public
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
