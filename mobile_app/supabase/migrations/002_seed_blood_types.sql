-- Migration: Ensure blood_type enum values exist
-- Date: 2025-04-27

DO $$
BEGIN
  -- Check if enum exists, create if not
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blood_type') THEN
    CREATE TYPE public.blood_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
  END IF;
END $$;
