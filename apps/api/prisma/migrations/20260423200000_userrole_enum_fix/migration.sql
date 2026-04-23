-- Fix clean-room deploy: ensure UserRole enum exists and User.role uses it.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('MANAGEMENT','ADMIN','AUDITOR','OPERATOR');
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'role'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE "User"
      ALTER COLUMN "role" DROP DEFAULT;

    ALTER TABLE "User"
      ALTER COLUMN "role" TYPE "UserRole"
      USING (
        CASE
          WHEN "role" IN ('MANAGEMENT','ADMIN','AUDITOR','OPERATOR') THEN "role"::"UserRole"
          WHEN "role" = 'USER' THEN 'OPERATOR'::"UserRole"
          ELSE 'OPERATOR'::"UserRole"
        END
      );

    ALTER TABLE "User"
      ALTER COLUMN "role" SET DEFAULT 'OPERATOR';
  END IF;
END$$;

