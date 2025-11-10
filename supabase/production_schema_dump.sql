


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."auto_join_new_users_to_project"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_target_org_id UUID;
  v_user_org_id UUID;
  v_user_org_name TEXT;
BEGIN
  -- 1. Create user's OWN organization first
  v_user_org_name := COALESCE(
    split_part(NEW.email, '@', 1) || '''s Team',
    'My Team'
  );

  -- Check if user already has an organization they created
  SELECT id INTO v_user_org_id
  FROM organizations
  WHERE created_by = NEW.id
  LIMIT 1;

  -- If not, create one
  IF v_user_org_id IS NULL THEN
    INSERT INTO organizations (name, created_by)
    VALUES (v_user_org_name, NEW.id)
    RETURNING id INTO v_user_org_id;

    -- Add user as owner of their own org
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_user_org_id, NEW.id, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    RAISE NOTICE 'Created organization "%" for user %', v_user_org_name, NEW.email;
  END IF;

  -- 2. Find and join "Walking on the Sun" project as viewer
  SELECT p.organization_id INTO v_target_org_id
  FROM projects p
  WHERE p.name ILIKE '%walking%sun%'
  LIMIT 1;

  -- Add user as viewer to Walking on the Sun org (if it exists)
  IF v_target_org_id IS NOT NULL THEN
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_target_org_id, NEW.id, 'viewer')
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    RAISE NOTICE 'Auto-added user % as viewer to Walking on the Sun project', NEW.email;
  ELSE
    RAISE NOTICE 'Walking on the Sun project not found - skipping auto-join for user %', NEW.email;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_join_new_users_to_project"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_by_email"("user_email" "text") RETURNS TABLE("id" "uuid", "email" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  BEGIN
    RETURN QUERY
    SELECT
      au.id,
      au.email::TEXT
    FROM auth.users au
    WHERE au.email = user_email
    LIMIT 1;
  END;
  $$;


ALTER FUNCTION "public"."get_user_by_email"("user_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."invite_user_to_organization"("p_organization_id" "uuid", "p_user_email" "text", "p_role" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id UUID;
  v_profile_exists BOOLEAN;
  v_member_exists BOOLEAN;
  v_result JSON;
BEGIN
  -- Check if user exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No user found with this email. They need to sign up first.'
    );
  END IF;

  -- Check if profile exists
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = v_user_id
  ) INTO v_profile_exists;

  -- Create profile if it doesn't exist
  IF NOT v_profile_exists THEN
    INSERT INTO profiles (id, email)
    VALUES (v_user_id, p_user_email)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Check if already a member
  SELECT EXISTS(
    SELECT 1 FROM organization_members
    WHERE organization_id = p_organization_id
    AND user_id = v_user_id
  ) INTO v_member_exists;

  IF v_member_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'This user is already a member of this organization.'
    );
  END IF;

  -- Add user to organization
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (p_organization_id, v_user_id, p_role);

  -- Return success with user info
  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_user_email
  );
END;
$$;


ALTER FUNCTION "public"."invite_user_to_organization"("p_organization_id" "uuid", "p_user_email" "text", "p_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_organization_creator"("org_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organizations
    WHERE id = org_id
    AND created_by = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."is_organization_creator"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_organization_member"("org_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."is_organization_member"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_organization_owner"("org_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role = 'owner'
  );
END;
$$;


ALTER FUNCTION "public"."is_organization_owner"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
  BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
  END;
  $$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_can_access_project"("project_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects p
    JOIN organization_members om ON om.organization_id = p.organization_id
    WHERE p.id = project_uuid
    AND om.user_id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."user_can_access_project"("project_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_can_edit_project"("project_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    -- Admins can edit everything
    is_admin()
    OR
    -- Editors and owners can edit
    EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = project_uuid
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'editor')
    )
  );
END;
$$;


ALTER FUNCTION "public"."user_can_edit_project"("project_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_can_edit_project_check"("project_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN user_can_edit_project(project_uuid);
END;
$$;


ALTER FUNCTION "public"."user_can_edit_project_check"("project_uuid" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "organization_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'editor'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."organization_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_admin" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."is_admin" IS 'Whether this user has admin privileges to view all users and projects';



CREATE TABLE IF NOT EXISTS "public"."project_assumptions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "status" "text" NOT NULL,
    "confidence" integer,
    "evidence" "text"[],
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_assumptions_confidence_check" CHECK ((("confidence" >= 1) AND ("confidence" <= 5))),
    CONSTRAINT "project_assumptions_status_check" CHECK (("status" = ANY (ARRAY['untested'::"text", 'testing'::"text", 'validated'::"text", 'invalidated'::"text"]))),
    CONSTRAINT "project_assumptions_type_check" CHECK (("type" = ANY (ARRAY['customer'::"text", 'problem'::"text", 'solution'::"text"])))
);


ALTER TABLE "public"."project_assumptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_competitors" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "suppliers" "text"[],
    "customers" "text"[],
    "supplier_companies" "text",
    "industry_customers" "text",
    "technical_regulatory_change" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_competitors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_decision_makers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "influence" "text",
    "description" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_decision_makers_influence_check" CHECK (("influence" = ANY (ARRAY['decision-maker'::"text", 'influencer'::"text", 'payer'::"text"])))
);


ALTER TABLE "public"."project_decision_makers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_first_target" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "customer_type" "text",
    "description" "text",
    "company_size" "text",
    "location" "text",
    "who_will_use" "text",
    "who_has_budget" "text",
    "other_influencers" "text",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_first_target_customer_type_check" CHECK (("customer_type" = ANY (ARRAY['business'::"text", 'consumer'::"text"])))
);


ALTER TABLE "public"."project_first_target" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_interviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "date" timestamp with time zone NOT NULL,
    "customer_segment" "text" NOT NULL,
    "interviewee" "text",
    "interviewee_type" "text",
    "format" "text",
    "duration" integer,
    "notes" "text" NOT NULL,
    "key_insights" "text"[],
    "surprises" "text",
    "next_action" "text",
    "follow_up_needed" boolean DEFAULT false,
    "assumptions_addressed" "uuid"[],
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_interviews_format_check" CHECK (("format" = ANY (ARRAY['in-person'::"text", 'phone'::"text", 'video'::"text", 'survey'::"text"]))),
    CONSTRAINT "project_interviews_interviewee_type_check" CHECK (("interviewee_type" = ANY (ARRAY['potential-buyer'::"text", 'competitor'::"text", 'substitute'::"text", 'knowledgeable'::"text"])))
);


ALTER TABLE "public"."project_interviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_iterations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "version" integer NOT NULL,
    "date" timestamp with time zone NOT NULL,
    "changes" "text" NOT NULL,
    "reasoning" "text" NOT NULL,
    "patterns_observed" "text",
    "riskiest_assumption" "text",
    "next_experiment" "text",
    "assumptions_affected" "uuid"[],
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_iterations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_module_completion" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "module_name" "text" NOT NULL,
    "completed" boolean DEFAULT false NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_module_completion" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_modules" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "module_name" "text" NOT NULL,
    "question_index" integer NOT NULL,
    "answer" "text" NOT NULL,
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "project_modules_module_name_check" CHECK (("module_name" = ANY (ARRAY['problem'::"text", 'customerSegments'::"text", 'solution'::"text"])))
);


ALTER TABLE "public"."project_modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_user_id_key" UNIQUE ("organization_id", "user_id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_assumptions"
    ADD CONSTRAINT "project_assumptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_competitors"
    ADD CONSTRAINT "project_competitors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_decision_makers"
    ADD CONSTRAINT "project_decision_makers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_first_target"
    ADD CONSTRAINT "project_first_target_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_first_target"
    ADD CONSTRAINT "project_first_target_project_id_key" UNIQUE ("project_id");



ALTER TABLE ONLY "public"."project_interviews"
    ADD CONSTRAINT "project_interviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_iterations"
    ADD CONSTRAINT "project_iterations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_module_completion"
    ADD CONSTRAINT "project_module_completion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_module_completion"
    ADD CONSTRAINT "project_module_completion_project_id_module_name_key" UNIQUE ("project_id", "module_name");



ALTER TABLE ONLY "public"."project_modules"
    ADD CONSTRAINT "project_modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_modules"
    ADD CONSTRAINT "project_modules_project_id_module_name_question_index_key" UNIQUE ("project_id", "module_name", "question_index");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_assumptions_project_id" ON "public"."project_assumptions" USING "btree" ("project_id");



CREATE INDEX "idx_assumptions_status" ON "public"."project_assumptions" USING "btree" ("status");



CREATE INDEX "idx_competitors_project_id" ON "public"."project_competitors" USING "btree" ("project_id");



CREATE INDEX "idx_decision_makers_project_id" ON "public"."project_decision_makers" USING "btree" ("project_id");



CREATE INDEX "idx_first_target_project_id" ON "public"."project_first_target" USING "btree" ("project_id");



CREATE INDEX "idx_interviews_date" ON "public"."project_interviews" USING "btree" ("date");



CREATE INDEX "idx_interviews_project_id" ON "public"."project_interviews" USING "btree" ("project_id");



CREATE INDEX "idx_iterations_project_id" ON "public"."project_iterations" USING "btree" ("project_id");



CREATE INDEX "idx_iterations_version" ON "public"."project_iterations" USING "btree" ("version");



CREATE INDEX "idx_org_members_org_id" ON "public"."organization_members" USING "btree" ("organization_id");



CREATE INDEX "idx_org_members_role" ON "public"."organization_members" USING "btree" ("role");



CREATE INDEX "idx_org_members_user_id" ON "public"."organization_members" USING "btree" ("user_id");



CREATE INDEX "idx_organizations_created_by" ON "public"."organizations" USING "btree" ("created_by");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_is_admin" ON "public"."profiles" USING "btree" ("is_admin") WHERE ("is_admin" = true);



CREATE INDEX "idx_project_module_completion_project_id" ON "public"."project_module_completion" USING "btree" ("project_id");



CREATE INDEX "idx_project_modules_module_name" ON "public"."project_modules" USING "btree" ("module_name");



CREATE INDEX "idx_project_modules_project_id" ON "public"."project_modules" USING "btree" ("project_id");



CREATE INDEX "idx_projects_created_by" ON "public"."projects" USING "btree" ("created_by");



CREATE INDEX "idx_projects_org_id" ON "public"."projects" USING "btree" ("organization_id");



CREATE OR REPLACE TRIGGER "auto_join_new_users_trigger" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."auto_join_new_users_to_project"();



CREATE OR REPLACE TRIGGER "update_organizations_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_assumptions_updated_at" BEFORE UPDATE ON "public"."project_assumptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_competitors_updated_at" BEFORE UPDATE ON "public"."project_competitors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_first_target_updated_at" BEFORE UPDATE ON "public"."project_first_target" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_interviews_updated_at" BEFORE UPDATE ON "public"."project_interviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_module_completion_updated_at" BEFORE UPDATE ON "public"."project_module_completion" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_modules_updated_at" BEFORE UPDATE ON "public"."project_modules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_assumptions"
    ADD CONSTRAINT "project_assumptions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_assumptions"
    ADD CONSTRAINT "project_assumptions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_competitors"
    ADD CONSTRAINT "project_competitors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_competitors"
    ADD CONSTRAINT "project_competitors_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_decision_makers"
    ADD CONSTRAINT "project_decision_makers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_decision_makers"
    ADD CONSTRAINT "project_decision_makers_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_first_target"
    ADD CONSTRAINT "project_first_target_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_first_target"
    ADD CONSTRAINT "project_first_target_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_interviews"
    ADD CONSTRAINT "project_interviews_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_interviews"
    ADD CONSTRAINT "project_interviews_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_iterations"
    ADD CONSTRAINT "project_iterations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."project_iterations"
    ADD CONSTRAINT "project_iterations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_module_completion"
    ADD CONSTRAINT "project_module_completion_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_modules"
    ADD CONSTRAINT "project_modules_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_modules"
    ADD CONSTRAINT "project_modules_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can view all organization members" ON "public"."organization_members" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view all organizations" ON "public"."organizations" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view all project assumptions" ON "public"."project_assumptions" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view all project competitors" ON "public"."project_competitors" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view all project decision makers" ON "public"."project_decision_makers" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view all project first targets" ON "public"."project_first_target" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view all project interviews" ON "public"."project_interviews" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view all project iterations" ON "public"."project_iterations" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Editors can create projects" ON "public"."projects" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."organization_members"
  WHERE (("organization_members"."organization_id" = "projects"."organization_id") AND ("organization_members"."user_id" = "auth"."uid"()) AND ("organization_members"."role" = ANY (ARRAY['owner'::"text", 'editor'::"text"]))))));



CREATE POLICY "Editors can modify project assumptions" ON "public"."project_assumptions" USING ("public"."user_can_edit_project"("project_id")) WITH CHECK ("public"."user_can_edit_project"("project_id"));



CREATE POLICY "Editors can modify project competitors" ON "public"."project_competitors" USING ("public"."user_can_edit_project"("project_id")) WITH CHECK ("public"."user_can_edit_project"("project_id"));



CREATE POLICY "Editors can modify project decision makers" ON "public"."project_decision_makers" USING ("public"."user_can_edit_project"("project_id")) WITH CHECK ("public"."user_can_edit_project"("project_id"));



CREATE POLICY "Editors can modify project first target" ON "public"."project_first_target" USING ("public"."user_can_edit_project"("project_id")) WITH CHECK ("public"."user_can_edit_project"("project_id"));



CREATE POLICY "Editors can modify project interviews" ON "public"."project_interviews" USING ("public"."user_can_edit_project"("project_id")) WITH CHECK ("public"."user_can_edit_project"("project_id"));



CREATE POLICY "Editors can modify project iterations" ON "public"."project_iterations" USING ("public"."user_can_edit_project"("project_id")) WITH CHECK ("public"."user_can_edit_project"("project_id"));



CREATE POLICY "Editors can modify project modules" ON "public"."project_modules" USING ("public"."user_can_edit_project"("project_id")) WITH CHECK ("public"."user_can_edit_project"("project_id"));



CREATE POLICY "Editors can update projects" ON "public"."projects" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."organization_members" "om"
     JOIN "public"."projects" "p" ON (("p"."organization_id" = "om"."organization_id")))
  WHERE (("p"."id" = "projects"."id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'editor'::"text"]))))));



CREATE POLICY "Only editors and owners can create projects" ON "public"."projects" FOR INSERT WITH CHECK (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."organization_members" "om"
  WHERE (("om"."organization_id" = "projects"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'editor'::"text"])))))));



CREATE POLICY "Only editors and owners can delete project modules" ON "public"."project_modules" FOR DELETE USING ("public"."user_can_edit_project_check"("project_id"));



CREATE POLICY "Only editors and owners can insert project modules" ON "public"."project_modules" FOR INSERT WITH CHECK ("public"."user_can_edit_project_check"("project_id"));



CREATE POLICY "Only editors and owners can manage assumptions" ON "public"."project_assumptions" USING ("public"."user_can_edit_project_check"("project_id")) WITH CHECK ("public"."user_can_edit_project_check"("project_id"));



CREATE POLICY "Only editors and owners can manage competitors" ON "public"."project_competitors" USING ("public"."user_can_edit_project_check"("project_id")) WITH CHECK ("public"."user_can_edit_project_check"("project_id"));



CREATE POLICY "Only editors and owners can manage decision makers" ON "public"."project_decision_makers" USING ("public"."user_can_edit_project_check"("project_id")) WITH CHECK ("public"."user_can_edit_project_check"("project_id"));



CREATE POLICY "Only editors and owners can manage first target" ON "public"."project_first_target" USING ("public"."user_can_edit_project_check"("project_id")) WITH CHECK ("public"."user_can_edit_project_check"("project_id"));



CREATE POLICY "Only editors and owners can manage interviews" ON "public"."project_interviews" USING ("public"."user_can_edit_project_check"("project_id")) WITH CHECK ("public"."user_can_edit_project_check"("project_id"));



CREATE POLICY "Only editors and owners can manage iterations" ON "public"."project_iterations" USING ("public"."user_can_edit_project_check"("project_id")) WITH CHECK ("public"."user_can_edit_project_check"("project_id"));



CREATE POLICY "Only editors and owners can manage module completion" ON "public"."project_module_completion" USING ("public"."user_can_edit_project_check"("project_id")) WITH CHECK ("public"."user_can_edit_project_check"("project_id"));



CREATE POLICY "Only editors and owners can update project modules" ON "public"."project_modules" FOR UPDATE USING ("public"."user_can_edit_project_check"("project_id"));



CREATE POLICY "Only editors and owners can update projects" ON "public"."projects" FOR UPDATE USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."organization_members" "om"
  WHERE (("om"."organization_id" = "projects"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = ANY (ARRAY['owner'::"text", 'editor'::"text"])))))));



CREATE POLICY "Only owners can delete projects" ON "public"."projects" FOR DELETE USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."organization_members" "om"
  WHERE (("om"."organization_id" = "projects"."organization_id") AND ("om"."user_id" = "auth"."uid"()) AND ("om"."role" = 'owner'::"text"))))));



CREATE POLICY "Organization members can view assumptions" ON "public"."project_assumptions" FOR SELECT USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."organization_members" "om" ON (("p"."organization_id" = "om"."organization_id")))
  WHERE (("p"."id" = "project_assumptions"."project_id") AND ("om"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Organization members can view competitors" ON "public"."project_competitors" FOR SELECT USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."organization_members" "om" ON (("p"."organization_id" = "om"."organization_id")))
  WHERE (("p"."id" = "project_competitors"."project_id") AND ("om"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Organization members can view decision makers" ON "public"."project_decision_makers" FOR SELECT USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."organization_members" "om" ON (("p"."organization_id" = "om"."organization_id")))
  WHERE (("p"."id" = "project_decision_makers"."project_id") AND ("om"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Organization members can view each other's profiles" ON "public"."profiles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."organization_members" "om1"
     JOIN "public"."organization_members" "om2" ON (("om1"."organization_id" = "om2"."organization_id")))
  WHERE (("om1"."user_id" = "auth"."uid"()) AND ("om2"."user_id" = "profiles"."id")))));



CREATE POLICY "Organization members can view first target" ON "public"."project_first_target" FOR SELECT USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."organization_members" "om" ON (("p"."organization_id" = "om"."organization_id")))
  WHERE (("p"."id" = "project_first_target"."project_id") AND ("om"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Organization members can view interviews" ON "public"."project_interviews" FOR SELECT USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."organization_members" "om" ON (("p"."organization_id" = "om"."organization_id")))
  WHERE (("p"."id" = "project_interviews"."project_id") AND ("om"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Organization members can view iterations" ON "public"."project_iterations" FOR SELECT USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."organization_members" "om" ON (("p"."organization_id" = "om"."organization_id")))
  WHERE (("p"."id" = "project_iterations"."project_id") AND ("om"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Organization members can view module completion" ON "public"."project_module_completion" FOR SELECT USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."organization_members" "om" ON (("p"."organization_id" = "om"."organization_id")))
  WHERE (("p"."id" = "project_module_completion"."project_id") AND ("om"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Organization members can view project modules" ON "public"."project_modules" FOR SELECT USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."organization_members" "om" ON (("p"."organization_id" = "om"."organization_id")))
  WHERE (("p"."id" = "project_modules"."project_id") AND ("om"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Organization members can view projects" ON "public"."projects" FOR SELECT USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."organization_members" "om"
  WHERE (("om"."organization_id" = "projects"."organization_id") AND ("om"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Owners can add members" ON "public"."organization_members" FOR INSERT WITH CHECK (("public"."is_organization_creator"("organization_id") OR "public"."is_organization_owner"("organization_id")));



CREATE POLICY "Owners can delete organizations" ON "public"."organizations" FOR DELETE USING ((("created_by" = "auth"."uid"()) OR "public"."is_organization_owner"("id")));



CREATE POLICY "Owners can remove members or users can leave" ON "public"."organization_members" FOR DELETE USING (("public"."is_organization_creator"("organization_id") OR "public"."is_organization_owner"("organization_id") OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Owners can update members" ON "public"."organization_members" FOR UPDATE USING (("public"."is_organization_creator"("organization_id") OR "public"."is_organization_owner"("organization_id")));



CREATE POLICY "Owners can update organizations" ON "public"."organizations" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR "public"."is_organization_owner"("id")));



CREATE POLICY "Users can create organizations" ON "public"."organizations" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view org members" ON "public"."organization_members" FOR SELECT USING (("public"."is_organization_creator"("organization_id") OR "public"."is_organization_member"("organization_id")));



CREATE POLICY "Users can view org projects" ON "public"."projects" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."organization_members"
  WHERE (("organization_members"."organization_id" = "projects"."organization_id") AND ("organization_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their organizations" ON "public"."organizations" FOR SELECT USING ((("created_by" = "auth"."uid"()) OR "public"."is_organization_member"("id")));



ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_assumptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_competitors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_decision_makers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_first_target" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_interviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_iterations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_module_completion" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_join_new_users_to_project"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_join_new_users_to_project"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_join_new_users_to_project"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_by_email"("user_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_by_email"("user_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_by_email"("user_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."invite_user_to_organization"("p_organization_id" "uuid", "p_user_email" "text", "p_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."invite_user_to_organization"("p_organization_id" "uuid", "p_user_email" "text", "p_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."invite_user_to_organization"("p_organization_id" "uuid", "p_user_email" "text", "p_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_organization_creator"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_organization_creator"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_organization_creator"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_organization_member"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_organization_member"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_organization_member"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_organization_owner"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_organization_owner"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_organization_owner"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_can_access_project"("project_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_can_access_project"("project_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_can_access_project"("project_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_can_edit_project"("project_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_can_edit_project"("project_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_can_edit_project"("project_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_can_edit_project_check"("project_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_can_edit_project_check"("project_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_can_edit_project_check"("project_uuid" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."project_assumptions" TO "anon";
GRANT ALL ON TABLE "public"."project_assumptions" TO "authenticated";
GRANT ALL ON TABLE "public"."project_assumptions" TO "service_role";



GRANT ALL ON TABLE "public"."project_competitors" TO "anon";
GRANT ALL ON TABLE "public"."project_competitors" TO "authenticated";
GRANT ALL ON TABLE "public"."project_competitors" TO "service_role";



GRANT ALL ON TABLE "public"."project_decision_makers" TO "anon";
GRANT ALL ON TABLE "public"."project_decision_makers" TO "authenticated";
GRANT ALL ON TABLE "public"."project_decision_makers" TO "service_role";



GRANT ALL ON TABLE "public"."project_first_target" TO "anon";
GRANT ALL ON TABLE "public"."project_first_target" TO "authenticated";
GRANT ALL ON TABLE "public"."project_first_target" TO "service_role";



GRANT ALL ON TABLE "public"."project_interviews" TO "anon";
GRANT ALL ON TABLE "public"."project_interviews" TO "authenticated";
GRANT ALL ON TABLE "public"."project_interviews" TO "service_role";



GRANT ALL ON TABLE "public"."project_iterations" TO "anon";
GRANT ALL ON TABLE "public"."project_iterations" TO "authenticated";
GRANT ALL ON TABLE "public"."project_iterations" TO "service_role";



GRANT ALL ON TABLE "public"."project_module_completion" TO "anon";
GRANT ALL ON TABLE "public"."project_module_completion" TO "authenticated";
GRANT ALL ON TABLE "public"."project_module_completion" TO "service_role";



GRANT ALL ON TABLE "public"."project_modules" TO "anon";
GRANT ALL ON TABLE "public"."project_modules" TO "authenticated";
GRANT ALL ON TABLE "public"."project_modules" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







