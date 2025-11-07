-- ============================================================================
-- AMSTERFLOW DATABASE SCHEMA
-- Multi-tenant Lean Canvas platform with real-time collaboration
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USER MANAGEMENT TABLES
-- ============================================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations (teams/companies)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization members with roles
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- ============================================================================
-- PROJECT TABLES
-- ============================================================================

-- Projects (Lean Canvas instances)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- LEAN CANVAS DATA TABLES
-- ============================================================================

-- Project modules (answers to Problem, Customer Segments, Solution questions)
CREATE TABLE project_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  module_name TEXT NOT NULL CHECK (module_name IN ('problem', 'customerSegments', 'solution')),
  question_index INTEGER NOT NULL,
  answer TEXT NOT NULL,
  updated_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, module_name, question_index)
);

-- ============================================================================
-- CUSTOMER DISCOVERY TABLES
-- ============================================================================

-- Project assumptions
CREATE TABLE project_assumptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('customer', 'problem', 'solution')),
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('untested', 'testing', 'validated', 'invalidated')),
  confidence INTEGER CHECK (confidence BETWEEN 1 AND 5),
  evidence TEXT[],
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project interviews
CREATE TABLE project_interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  customer_segment TEXT NOT NULL,
  interviewee TEXT,
  interviewee_type TEXT CHECK (interviewee_type IN ('potential-buyer', 'competitor', 'substitute', 'knowledgeable')),
  format TEXT CHECK (format IN ('in-person', 'phone', 'video', 'survey')),
  duration INTEGER,
  notes TEXT NOT NULL,
  key_insights TEXT[],
  surprises TEXT,
  next_action TEXT,
  follow_up_needed BOOLEAN DEFAULT false,
  assumptions_addressed UUID[],
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project iterations
CREATE TABLE project_iterations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  version INTEGER NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  changes TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  patterns_observed TEXT,
  riskiest_assumption TEXT,
  next_experiment TEXT,
  assumptions_affected UUID[],
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SECTOR MAP TABLES
-- ============================================================================

-- Sector map: First target customer
CREATE TABLE project_first_target (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  customer_type TEXT CHECK (customer_type IN ('business', 'consumer')),
  description TEXT,
  company_size TEXT,
  location TEXT,
  who_will_use TEXT,
  who_has_budget TEXT,
  other_influencers TEXT,
  updated_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id)
);

-- Sector map: Competitors
CREATE TABLE project_competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  suppliers TEXT[],
  customers TEXT[],
  supplier_companies TEXT,
  industry_customers TEXT,
  technical_regulatory_change TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sector map: Decision makers (for B2C)
CREATE TABLE project_decision_makers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  influence TEXT CHECK (influence IN ('decision-maker', 'influencer', 'payer')),
  description TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_organizations_created_by ON organizations(created_by);
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_projects_org_id ON projects(organization_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_project_modules_project_id ON project_modules(project_id);
CREATE INDEX idx_project_modules_module_name ON project_modules(module_name);
CREATE INDEX idx_assumptions_project_id ON project_assumptions(project_id);
CREATE INDEX idx_assumptions_status ON project_assumptions(status);
CREATE INDEX idx_interviews_project_id ON project_interviews(project_id);
CREATE INDEX idx_interviews_date ON project_interviews(date);
CREATE INDEX idx_iterations_project_id ON project_iterations(project_id);
CREATE INDEX idx_iterations_version ON project_iterations(version);
CREATE INDEX idx_competitors_project_id ON project_competitors(project_id);
CREATE INDEX idx_decision_makers_project_id ON project_decision_makers(project_id);
CREATE INDEX idx_first_target_project_id ON project_first_target(project_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_modules_updated_at BEFORE UPDATE ON project_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_assumptions_updated_at BEFORE UPDATE ON project_assumptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_interviews_updated_at BEFORE UPDATE ON project_interviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_competitors_updated_at BEFORE UPDATE ON project_competitors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_first_target_updated_at BEFORE UPDATE ON project_first_target
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Schema created successfully! 11 tables, 15 indexes, and triggers ready.';
    RAISE NOTICE 'Next step: Run the RLS policies script (rls-policies.sql)';
END $$;
