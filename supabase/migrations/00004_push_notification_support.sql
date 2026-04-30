ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS device_platform VARCHAR(20);

CREATE OR REPLACE FUNCTION public.create_test_notification(
  p_title TEXT DEFAULT 'Test notification BloodLink',
  p_body TEXT DEFAULT 'Si tu vois ce message, le flux de notification in-app fonctionne.',
  p_type public.notification_type DEFAULT 'system',
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_notification_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.notifications (
    user_id,
    title,
    body,
    type,
    data
  )
  VALUES (
    v_user_id,
    LEFT(COALESCE(p_title, 'Test notification BloodLink'), 200),
    COALESCE(p_body, 'Si tu vois ce message, le flux de notification in-app fonctionne.'),
    COALESCE(p_type, 'system'),
    COALESCE(p_data, '{}'::jsonb)
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_test_notification(TEXT, TEXT, public.notification_type, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_test_notification(TEXT, TEXT, public.notification_type, JSONB) TO authenticated;
