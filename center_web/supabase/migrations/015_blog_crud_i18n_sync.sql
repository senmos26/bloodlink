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

UPDATE public.blog_posts
SET title_i18n = public.set_translation(COALESCE(title_i18n, '{}'::jsonb), 'fr', title),
    excerpt_i18n = public.set_translation(COALESCE(excerpt_i18n, '{}'::jsonb), 'fr', excerpt),
    introduction_i18n = public.set_translation(COALESCE(introduction_i18n, '{}'::jsonb), 'fr', introduction),
    conclusion_i18n = public.set_translation(COALESCE(conclusion_i18n, '{}'::jsonb), 'fr', conclusion);

GRANT EXECUTE ON FUNCTION public.create_blog_post(character varying, character varying, character varying, character varying, text, character varying, text, character varying, character varying, text, jsonb, jsonb, text, text[], character varying) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_blog_post(uuid, character varying, character varying, character varying, character varying, text, character varying, text, character varying, character varying, text, jsonb, jsonb, text, text[], character varying) TO authenticated;
