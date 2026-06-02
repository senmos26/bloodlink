-- Migration: 00008_center_notifications_automation
-- Description: Automates notifications for center administrators when appointments are booked or cancelled.

-- 1. Function and Trigger for Appointment Created
CREATE OR REPLACE FUNCTION public.handle_appointment_created()
RETURNS TRIGGER AS $$
DECLARE
  v_center_name VARCHAR;
  v_admin_id UUID;
  v_donor_name VARCHAR;
BEGIN
  -- Get center admin and center name
  SELECT name, admin_id INTO v_center_name, v_admin_id 
  FROM public.centers 
  WHERE id = NEW.center_id;

  -- Get donor name
  SELECT full_name INTO v_donor_name 
  FROM public.profiles 
  WHERE id = NEW.donor_id;

  -- If the center has an admin, insert a notification for them
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, type, data)
    VALUES (
      v_admin_id,
      'Nouveau rendez-vous',
      COALESCE(v_donor_name, 'Un donneur') || ' a réservé un créneau pour le ' || to_char(NEW.scheduled_date AT TIME ZONE 'UTC', 'DD/MM/YYYY à HH24:MI') || '.',
      'appointment',
      jsonb_build_object(
        'appointment_id', NEW.id,
        'center_id', NEW.center_id,
        'scheduled_date', NEW.scheduled_date
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_appointment_created
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_appointment_created();


-- 2. Function and Trigger for Appointment Status Changed (Cancelled)
CREATE OR REPLACE FUNCTION public.handle_appointment_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_center_name VARCHAR;
  v_admin_id UUID;
  v_donor_name VARCHAR;
BEGIN
  -- We only trigger a notification if the status has changed to 'cancelled'
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Get center admin and center name
    SELECT name, admin_id INTO v_center_name, v_admin_id 
    FROM public.centers 
    WHERE id = NEW.center_id;

    -- Get donor name
    SELECT full_name INTO v_donor_name 
    FROM public.profiles 
    WHERE id = NEW.donor_id;

    -- Insert notification for center admin
    IF v_admin_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, data)
      VALUES (
        v_admin_id,
        'Rendez-vous annulé',
        COALESCE(v_donor_name, 'Un donneur') || ' a annulé son rendez-vous du ' || to_char(NEW.scheduled_date AT TIME ZONE 'UTC', 'DD/MM/YYYY à HH24:MI') || '.',
        'appointment',
        jsonb_build_object(
          'appointment_id', NEW.id,
          'center_id', NEW.center_id,
          'status', NEW.status
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_appointment_status_changed
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_appointment_status_changed();
