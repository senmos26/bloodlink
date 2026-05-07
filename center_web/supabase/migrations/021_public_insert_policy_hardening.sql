DROP POLICY IF EXISTS contacts_anon_insert ON public.contacts;
CREATE POLICY contacts_anon_insert
ON public.contacts
FOR INSERT
TO anon
WITH CHECK (
  status = 'new'
  AND length(btrim(name)) > 0
  AND length(btrim(email)) > 0
  AND position('@' in email) > 1
  AND length(btrim(message)) > 0
);

DROP POLICY IF EXISTS blog_comments_anon_insert ON public.blog_comments;
CREATE POLICY blog_comments_anon_insert
ON public.blog_comments
FOR INSERT
TO anon
WITH CHECK (
  status = 'pending'
  AND length(btrim(author_name)) > 0
  AND length(btrim(author_email)) > 0
  AND position('@' in author_email) > 1
  AND length(btrim(content)) > 0
);

DROP POLICY IF EXISTS leads_anon_insert ON public.leads;
CREATE POLICY leads_anon_insert
ON public.leads
FOR INSERT
TO anon
WITH CHECK (
  status = 'new'
  AND length(btrim(name)) > 0
  AND length(btrim(email)) > 0
  AND position('@' in email) > 1
);
