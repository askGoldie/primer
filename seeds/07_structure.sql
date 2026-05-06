-- =============================================================================
-- Seed 07: Structure Changes
-- Depends on: seeds 02–03
--
-- Adds new users and org members required for the demo personas, then
-- applies structural node changes to Tier Internal:
--   - Morgan Kim re-titled as CFO (executive_leader)
--   - Cameron, Ashton, Peyton promoted from individual → team (manager) nodes
--   - Derek Solís individual node added under Cameron's Platform team
--   - Sam Wentworth offboarded node added (user_id = NULL)
-- =============================================================================


-- ---------------------------------------------------------------------------
-- New users
-- ---------------------------------------------------------------------------
INSERT INTO users (id, email, name, locale, email_verified, is_admin) VALUES
  ('00000000-0000-4000-b000-000000000070', 'linda.reyes@tier.internal',   'Linda Reyes',   'en', TRUE, FALSE),  -- HR Director
  ('00000000-0000-4000-b000-000000000080', 'carlos.mendez@tier.internal', 'Carlos Mendez', 'en', TRUE, FALSE),  -- Chief of Staff
  ('00000000-0000-4000-b000-000000000090', 'aisha.torres@tier.internal',  'Aisha Torres',  'en', TRUE, FALSE),  -- New Hire (unplaced)
  ('00000000-0000-4000-b000-000000000092', 'derek.solis@tier.internal',   'Derek Solís',   'en', TRUE, FALSE),  -- IC under Platform Team
  ('00000000-0000-4000-b000-000000000095', 'sam.wentworth@tier.internal', 'Sam Wentworth', 'en', TRUE, FALSE);  -- Offboarded


-- ---------------------------------------------------------------------------
-- New org members
-- Linda (HR Director) uses hr_admin so she can operate org-wide without
-- a hierarchy node. Carlos (Chief of Staff) uses owner to enable proxy
-- operations such as recording snapshots on behalf of the CEO. Aisha,
-- Derek, and Sam use standard editor/viewer roles.
-- ---------------------------------------------------------------------------
INSERT INTO org_members (organization_id, user_id, role, assigned_by) VALUES
  ('00000000-0000-4000-a000-000000000020', '00000000-0000-4000-b000-000000000070', 'hr_admin', '00000000-0000-4000-b000-000000000001'),  -- Linda Reyes
  ('00000000-0000-4000-a000-000000000020', '00000000-0000-4000-b000-000000000080', 'owner',  '00000000-0000-4000-b000-000000000001'),  -- Carlos Mendez
  ('00000000-0000-4000-a000-000000000020', '00000000-0000-4000-b000-000000000090', 'viewer', '00000000-0000-4000-b000-000000000070'),  -- Aisha Torres
  ('00000000-0000-4000-a000-000000000020', '00000000-0000-4000-b000-000000000092', 'editor', '00000000-0000-4000-b000-000000000070'),  -- Derek Solís
  ('00000000-0000-4000-a000-000000000020', '00000000-0000-4000-b000-000000000095', 'viewer', '00000000-0000-4000-b000-000000000001'); -- Sam Wentworth

-- Mark Sam Wentworth as offboarded
UPDATE org_members
SET    removed_at     = NOW() - INTERVAL '7 days',
       removal_reason = 'voluntary_resignation'
WHERE  organization_id = '00000000-0000-4000-a000-000000000020'
AND    user_id         = '00000000-0000-4000-b000-000000000095';


-- ---------------------------------------------------------------------------
-- Node changes — Morgan Kim → CFO (executive_leader)
-- ---------------------------------------------------------------------------
UPDATE org_hierarchy_nodes
SET    node_type  = 'executive_leader',
       title      = 'CFO',
       updated_at = NOW()
WHERE  id = '00000000-0000-4000-b100-000000000030';


-- ---------------------------------------------------------------------------
-- Node changes — Cameron, Ashton, Peyton → team (manager) nodes
-- These ICs become Engineering Team Leads sitting between Hayden Park and ICs.
-- ---------------------------------------------------------------------------
UPDATE org_hierarchy_nodes
SET    node_type  = 'team',
       title      = 'Platform Engineering Lead',
       updated_at = NOW()
WHERE  id = '00000000-0000-4000-b100-000000000211';

UPDATE org_hierarchy_nodes
SET    node_type  = 'team',
       title      = 'Backend Engineering Lead',
       updated_at = NOW()
WHERE  id = '00000000-0000-4000-b100-000000000212';

UPDATE org_hierarchy_nodes
SET    node_type  = 'team',
       title      = 'Frontend Engineering Lead',
       updated_at = NOW()
WHERE  id = '00000000-0000-4000-b100-000000000213';


-- ---------------------------------------------------------------------------
-- New nodes
-- ---------------------------------------------------------------------------
INSERT INTO org_hierarchy_nodes
  (id, organization_id, parent_id, node_type, name, title, user_id, sort_order, created_by)
VALUES

  -- Derek Solís — individual under Platform Engineering (Cameron's team, b100-211)
  ('00000000-0000-4000-b100-000000000214',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000211',
   'individual', 'Derek Solís', 'Software Engineer',
   '00000000-0000-4000-b000-000000000092',
   0,
   '00000000-0000-4000-b000-000000000211'),

  -- Sam Wentworth — offboarded; node stays in hierarchy, user_id cleared
  ('00000000-0000-4000-b100-000000000095',
   '00000000-0000-4000-a000-000000000020',
   '00000000-0000-4000-b100-000000000011',  -- under Taylor Brooks / Logistics
   'individual', 'Sam Wentworth', 'Supply Chain Analyst',
   NULL,
   3,
   '00000000-0000-4000-b000-000000000001');
