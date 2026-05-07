ALTER TABLE public.leads
  ALTER COLUMN source SET DEFAULT 'website';

CREATE OR REPLACE FUNCTION public.create_lead(
    p_name VARCHAR,
    p_email VARCHAR,
    p_company VARCHAR DEFAULT NULL,
    p_interest TEXT DEFAULT NULL,
    p_source VARCHAR DEFAULT 'website',
    p_article_title TEXT DEFAULT NULL,
    p_article_slug TEXT DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.leads (
        name, email, company, interest, source,
        article_title, article_slug, referrer, status
    )
    VALUES (
        p_name, p_email, p_company, p_interest, p_source,
        p_article_title, p_article_slug, p_referrer, 'new'
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_leads(
    p_status VARCHAR DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    name VARCHAR,
    email VARCHAR,
    company VARCHAR,
    interest TEXT,
    source VARCHAR,
    article_title TEXT,
    article_slug TEXT,
    referrer TEXT,
    status VARCHAR,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id, l.name, l.email, l.company, l.interest,
        l.source, l.article_title, l.article_slug, l.referrer,
        l.status, l.created_at, l.updated_at
    FROM public.leads l
    WHERE (p_status IS NULL OR l.status = p_status)
      AND (p_search IS NULL OR
           l.name ILIKE '%' || p_search || '%' OR
           l.email ILIKE '%' || p_search || '%' OR
           l.company ILIKE '%' || p_search || '%' OR
           l.source ILIKE '%' || p_search || '%')
    ORDER BY l.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.count_leads(
    p_status VARCHAR DEFAULT NULL,
    p_search TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    v_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.leads l
    WHERE (p_status IS NULL OR l.status = p_status)
      AND (p_search IS NULL OR
           l.name ILIKE '%' || p_search || '%' OR
           l.email ILIKE '%' || p_search || '%' OR
           l.company ILIKE '%' || p_search || '%' OR
           l.source ILIKE '%' || p_search || '%');

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
