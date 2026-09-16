import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

let pgliteInstance: PGlite | null = null;
let pgPool: pg.Pool | null = null;
let isConfigured = false;
let isInitialized = false;
let initPromise: Promise<{ pglite?: PGlite; pool?: pg.Pool }> | null = null;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  description TEXT,
  website VARCHAR(255),
  email VARCHAR(255),
  location VARCHAR(255),
  verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_profiles (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64),
  college VARCHAR(255),
  degree VARCHAR(255),
  graduation_year INTEGER,
  skills TEXT,
  resume_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS internships (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64) REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  internship_type VARCHAR(64) NOT NULL,
  location VARCHAR(255) NOT NULL,
  work_mode VARCHAR(64) NOT NULL,
  duration VARCHAR(64) NOT NULL,
  stipend VARCHAR(64) NOT NULL,
  currency VARCHAR(16) DEFAULT 'INR',
  is_paid BOOLEAN DEFAULT TRUE,
  experience_level VARCHAR(64),
  education VARCHAR(255),
  eligibility TEXT,
  responsibilities TEXT,
  benefits TEXT,
  learning_opportunities TEXT,
  selection_process TEXT,
  application_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING_APPROVAL',
  external_source VARCHAR(64) DEFAULT NULL,
  external_id VARCHAR(128) DEFAULT NULL,
  external_url VARCHAR(512) DEFAULT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS external_sync_logs (
  id VARCHAR(64) PRIMARY KEY,
  triggered_by VARCHAR(64) NOT NULL,
  provider VARCHAR(64) NOT NULL,
  fetched_count INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) REFERENCES student_profiles(id) ON DELETE CASCADE,
  internship_id VARCHAR(64) REFERENCES internships(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'APPLIED',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, internship_id)
);

CREATE TABLE IF NOT EXISTS saved_internships (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) REFERENCES student_profiles(id) ON DELETE CASCADE,
  internship_id VARCHAR(64) REFERENCES internships(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, internship_id)
);

CREATE TABLE IF NOT EXISTS admin_reviews (
  id VARCHAR(64) PRIMARY KEY,
  internship_id VARCHAR(64) REFERENCES internships(id) ON DELETE CASCADE,
  admin_id VARCHAR(64) REFERENCES users(id),
  action VARCHAR(32) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id),
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  metadata TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_notifications (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64) REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(32) NOT NULL,
  read_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_internships_status ON internships(status);
CREATE INDEX IF NOT EXISTS idx_internships_company_id ON internships(company_id);
CREATE INDEX IF NOT EXISTS idx_internships_category ON internships(category);
CREATE INDEX IF NOT EXISTS idx_internships_deadline ON internships(application_deadline);
CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_internship ON applications(internship_id);
CREATE INDEX IF NOT EXISTS idx_saved_student ON saved_internships(student_id);
CREATE INDEX IF NOT EXISTS idx_admin_reviews_internship ON admin_reviews(internship_id);
CREATE INDEX IF NOT EXISTS idx_admin_reviews_created ON admin_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_notifications_company ON company_notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_internships_external ON internships(external_source, external_id);
CREATE INDEX IF NOT EXISTS idx_external_sync_logs_created ON external_sync_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS student_documents (
  id VARCHAR(64) PRIMARY KEY,
  student_id VARCHAR(64) REFERENCES student_profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(32) NOT NULL DEFAULT 'RESUME',
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS application_documents (
  id VARCHAR(64) PRIMARY KEY,
  application_id VARCHAR(64) REFERENCES applications(id) ON DELETE CASCADE,
  document_type VARCHAR(32) NOT NULL DEFAULT 'RESUME',
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS application_status_history (
  id VARCHAR(64) PRIMARY KEY,
  application_id VARCHAR(64) REFERENCES applications(id) ON DELETE CASCADE,
  old_status VARCHAR(32),
  new_status VARCHAR(32) NOT NULL,
  changed_by VARCHAR(64) REFERENCES users(id),
  changed_by_role VARCHAR(32) NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_entity_type VARCHAR(64),
  related_entity_id VARCHAR(64),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_documents_student ON student_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_application_documents_app ON application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_app_status_hist_app ON application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_app_status_hist_created ON application_status_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Automatic Column Migration for Existing Stores
ALTER TABLE internships ADD COLUMN IF NOT EXISTS external_source VARCHAR(64);
ALTER TABLE internships ADD COLUMN IF NOT EXISTS external_id VARCHAR(128);
ALTER TABLE internships ADD COLUMN IF NOT EXISTS external_url VARCHAR(512);
ALTER TABLE internships ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS dob VARCHAR(32);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS city VARCHAR(128);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS state VARCHAR(128);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS country VARCHAR(128);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS department VARCHAR(255);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS cgpa VARCHAR(32);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS career_objective TEXT;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS about_me TEXT;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(512);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS github_url VARCHAR(512);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(512);
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS projects TEXT;

ALTER TABLE applications ADD COLUMN IF NOT EXISTS cover_letter TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS additional_info TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_id VARCHAR(64);
`;

export async function getDbClient(): Promise<{ pglite?: PGlite; pool?: pg.Pool }> {
  if (isInitialized) {
    return { pglite: pgliteInstance ?? undefined, pool: pgPool ?? undefined };
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const connectionString = env.DATABASE_URL;

    if (connectionString) {
      let candidatePool: pg.Pool | null = null;
      try {
        const { Pool } = pg;
        candidatePool = new Pool({
          connectionString,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
          ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
        });

        // Execute schema initialization
        await candidatePool.query(SCHEMA_SQL);
        pgPool = candidatePool;
        isConfigured = true;
        isInitialized = true;
        logger.info('Connected to PostgreSQL via DATABASE_URL and initialized schema');
        await seedBaseAccounts();
        return { pool: pgPool };
      } catch (err) {
        if (candidatePool) {
          try {
            await candidatePool.end();
          } catch {
            // Ignore termination errors during fallback
          }
        }
        pgPool = null;
        logger.warn('Failed to initialize external PostgreSQL database, falling back to local PGlite driver');
      }
    }

    // Fallback to local embedded PGlite
    let dbDir = path.resolve(process.cwd(), 'data/internhub_pglite');
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      dbDir = path.join(os.tmpdir(), 'internhub_pglite');
    }
    
    // Auto-recovery: Check for stale locks or incomplete files
    try {
      if (fs.existsSync(dbDir)) {
        const pidFile = path.join(dbDir, 'postmaster.pid');
        if (fs.existsSync(pidFile)) {
          fs.unlinkSync(pidFile);
        }
        // Verify postgresql.conf exists; if directory has partial files missing config, clean it
        const confFile = path.join(dbDir, 'postgresql.conf');
        const files = fs.readdirSync(dbDir);
        if (files.length > 0 && !fs.existsSync(confFile)) {
          logger.info('Detected incomplete PGlite directory, initializing clean store...');
          fs.rmSync(dbDir, { recursive: true, force: true });
          fs.mkdirSync(dbDir, { recursive: true });
        }
      } else {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      pgliteInstance = new PGlite(dbDir);
      await pgliteInstance.waitReady;
      await pgliteInstance.exec(SCHEMA_SQL);
      isConfigured = true;
      isInitialized = true;
      logger.info(`PGlite embedded database initialized at ${dbDir}`);
    } catch (dirErr) {
      logger.warn('PGlite directory initialization error, recovering with clean database:', dirErr instanceof Error ? dirErr.message : 'Unknown error');
      try {
        // Clear directory and recreate
        fs.rmSync(dbDir, { recursive: true, force: true });
        fs.mkdirSync(dbDir, { recursive: true });
        pgliteInstance = new PGlite(dbDir);
        await pgliteInstance.waitReady;
        await pgliteInstance.exec(SCHEMA_SQL);
        isConfigured = true;
        isInitialized = true;
        logger.info('PGlite embedded database recovered and initialized');
      } catch (inMemFallbackErr) {
        logger.warn('Filesystem database unavailable, launching in-memory PGlite instance');
        pgliteInstance = new PGlite();
        await pgliteInstance.waitReady;
        await pgliteInstance.exec(SCHEMA_SQL);
        isConfigured = true;
        isInitialized = true;
        logger.info('PGlite in-memory database initialized');
      }
    }

    await seedBaseAccounts();
    return { pglite: pgliteInstance };
  })().catch((err) => {
    initPromise = null;
    throw err;
  });

  return initPromise;
}

async function seedBaseAccounts(): Promise<void> {
  try {
    // Generate secure SHA-256 password hash for common demo credentials (admin@123)
    const demoPasswordHash = crypto.createHash('sha256').update('admin@123').digest('hex');

    // Seed standard demo users if not present; synchronize password hash on conflict
    await query(
      `INSERT INTO users (id, username, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = CURRENT_TIMESTAMP`,
      ['usr_std_9021', 'student', demoPasswordHash, 'STUDENT']
    );

    await query(
      `INSERT INTO users (id, username, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = CURRENT_TIMESTAMP`,
      ['usr_cmp_4410', 'company', demoPasswordHash, 'COMPANY']
    );

    await query(
      `INSERT INTO users (id, username, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = CURRENT_TIMESTAMP`,
      ['usr_adm_0001', 'admin', demoPasswordHash, 'ADMIN']
    );

    // Seed company node for usr_cmp_4410 (Nexus Dynamics Labs) with VERIFIED status
    await query(
      `INSERT INTO companies (id, user_id, company_name, description, website, email, location, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET company_name = EXCLUDED.company_name, verification_status = EXCLUDED.verification_status`,
      [
        'cmp_nexus_01',
        'usr_cmp_4410',
        'Nexus Dynamics Labs',
        'Advanced technology and research laboratory partnering with universities for cutting-edge engineering internships.',
        'https://nexusdynamics.tech',
        'talent@nexusdynamics.tech',
        'Bengaluru, Karnataka',
        'VERIFIED'
      ]
    );

    // Seed student profile for usr_std_9021
    await query(
      `INSERT INTO student_profiles (id, user_id, full_name, email, phone, college, degree, graduation_year, skills, resume_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name`,
      [
        'prof_std_9021',
        'usr_std_9021',
        'Alex Mercer',
        'student@campus.internhub.edu',
        '+91 98765 43210',
        'National Institute of Technology',
        'B.Tech in Computer Science & Engineering',
        2026,
        'TypeScript, React, Node.js, PostgreSQL, Distributed Systems',
        'https://internhub.edu/resumes/alex_mercer.pdf'
      ]
    );

    // Seed second company: Apex Systems Robotics (PENDING)
    await query(
      `INSERT INTO users (id, username, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = CURRENT_TIMESTAMP`,
      ['usr_cmp_5520', 'apexrobotics', demoPasswordHash, 'COMPANY']
    );

    await query(
      `INSERT INTO companies (id, user_id, company_name, description, website, email, location, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET company_name = EXCLUDED.company_name`,
      [
        'cmp_apex_02',
        'usr_cmp_5520',
        'Apex Systems Robotics',
        'Autonomous robotics and embedded control platforms for industrial logistics.',
        'https://apexrobotics.io',
        'careers@apexrobotics.io',
        'Hyderabad, Telangana',
        'PENDING'
      ]
    );

    // Seed initial internships if table is empty or specific demo ones
    const checkInt = await query('SELECT COUNT(*) as count FROM internships');
    const intCount = parseInt(checkInt.rows[0]?.count || '0', 10);
    if (intCount === 0) {
      const now = new Date();
      const futureDate1 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const futureDate2 = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString();
      const futureDate3 = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString();
      const futureDate4 = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();

      await query(
        `INSERT INTO internships (
          id, company_id, title, category, description, internship_type, location,
          work_mode, duration, stipend, currency, is_paid, experience_level, education,
          eligibility, responsibilities, benefits, learning_opportunities, selection_process,
          application_deadline, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [
          'int_nexus_01',
          'cmp_nexus_01',
          'Distributed Systems Engineering Intern',
          'Software Engineering',
          'Build fault-tolerant microservices, high-throughput RPC pipelines, and event streaming architectures with modern TypeScript and Go.',
          'Full-time Internship',
          'Bengaluru, Karnataka',
          'Hybrid',
          '6 Months',
          '₹45,000 / month',
          'INR',
          true,
          'Intermediate',
          'B.Tech / M.Tech in CS, IT or equivalent',
          'Strong command of data structures, algorithms, and concurrency primitives.',
          'Design and benchmark gRPC interfaces. Optimize database query performance under peak load.',
          'Mentorship by principal engineers, equipment stipend, certificate of excellence, PPO opportunity.',
          'Deep architectural exposure to scalable backend topologies.',
          'Online Assessment -> Technical Interview 1 -> Technical Interview 2 -> Offer',
          futureDate1,
          'APPROVED'
        ]
      );

      await query(
        `INSERT INTO internships (
          id, company_id, title, category, description, internship_type, location,
          work_mode, duration, stipend, currency, is_paid, experience_level, education,
          eligibility, responsibilities, benefits, learning_opportunities, selection_process,
          application_deadline, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [
          'int_nexus_02',
          'cmp_nexus_01',
          'Autonomous Fleet Telemetry Intern',
          'Embedded Systems',
          'Develop real-time CAN bus telemetry ingestion pipelines and edge computing diagnostics for autonomous research vehicles.',
          'Research Internship',
          'Bengaluru, Karnataka',
          'On-site',
          '3 Months',
          '₹50,000 / month',
          'INR',
          true,
          'Beginner / Intermediate',
          'B.Tech in CS, ECE, or Robotics',
          'Basic C/C++ or Rust experience. Familiarity with Linux socket programming.',
          'Deploy edge daemon on vehicle test benches. Analyze communication latency.',
          'Hands-on lab access, dedicated hardware development boards.',
          'Direct mentorship in embedded safety-critical software standards.',
          'Resume Screening -> Coding Challenge -> Technical Panel',
          futureDate2,
          'PENDING_APPROVAL'
        ]
      );

      await query(
        `INSERT INTO internships (
          id, company_id, title, category, description, internship_type, location,
          work_mode, duration, stipend, currency, is_paid, experience_level, education,
          eligibility, responsibilities, benefits, learning_opportunities, selection_process,
          application_deadline, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [
          'int_apex_01',
          'cmp_apex_02',
          'Warehouse Robotics Control Fellow',
          'Robotics & Automation',
          'Implement ROS2 motion-planning nodes and lidar-based obstacle avoidance algorithms for automated guided vehicles (AGVs).',
          'Co-op Internship',
          'Hyderabad, Telangana',
          'On-site',
          '6 Months',
          '₹40,000 / month',
          'INR',
          true,
          'Intermediate',
          'Pre-final / Final year engineering students',
          'Working knowledge of ROS / ROS2, Python, and sensor fusion basics.',
          'Tune PID controllers and test mapping routines in simulation and warehouse testbeds.',
          'Full lab access, meal stipends, conference sponsorship.',
          'Production robotics deployment experience.',
          'Technical Assessment -> System Design Interview -> Placement Offer',
          futureDate3,
          'PENDING_APPROVAL'
        ]
      );

      await query(
        `INSERT INTO internships (
          id, company_id, title, category, description, internship_type, location,
          work_mode, duration, stipend, currency, is_paid, experience_level, education,
          eligibility, responsibilities, benefits, learning_opportunities, selection_process,
          application_deadline, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [
          'int_nexus_03',
          'cmp_nexus_01',
          'Frontend Platform Architecture Intern',
          'Web Development',
          'Build component libraries, accessibility compliance suites, and interactive data visualization dashboards for telemetry analytics.',
          'Summer Internship',
          'Remote',
          'Remote',
          '3 Months',
          '₹35,000 / month',
          'INR',
          true,
          'Beginner',
          'Undergraduate students in engineering or science',
          'React, TypeScript, CSS layout fundamentals, and state management experience.',
          'Implement WCAG 2.1 AA compliant UI elements. Integrate REST endpoints.',
          'Flexible hours, remote equipment allowance.',
          'Production React architecture and enterprise component design.',
          'Portfolio Review -> Pair Programming Session',
          futureDate4,
          'CHANGES_REQUESTED'
        ]
      );

      // Seed review for int_nexus_03
      await query(
        `INSERT INTO admin_reviews (id, internship_id, admin_id, action, reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          'rev_init_01',
          'int_nexus_03',
          'usr_adm_0001',
          'CHANGES_REQUESTED',
          'Please specify exact stipend structure and clarify weekly hours commitment for remote candidates.'
        ]
      );

      // Seed initial audit logs
      await query(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          'aud_init_01',
          'usr_adm_0001',
          'COMPANY_VERIFIED',
          'COMPANY',
          'cmp_nexus_01',
          JSON.stringify({ company_name: 'Nexus Dynamics Labs', status: 'VERIFIED', reason: 'College enterprise MoU verified' })
        ]
      );

      await query(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          'aud_init_02',
          'usr_adm_0001',
          'INTERNSHIP_APPROVED',
          'INTERNSHIP',
          'int_nexus_01',
          JSON.stringify({ title: 'Distributed Systems Engineering Intern', company: 'Nexus Dynamics Labs' })
        ]
      );

      await query(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          'aud_init_03',
          'usr_adm_0001',
          'INTERNSHIP_CHANGES_REQUESTED',
          'INTERNSHIP',
          'int_nexus_03',
          JSON.stringify({ title: 'Frontend Platform Architecture Intern', reason: 'Clarify weekly hours' })
        ]
      );
    }

    logger.info('Base demo users and profiles verified in database');
  } catch (err) {
    logger.error('Error seeding base demo accounts', err);
  }
}

/**
 * Execute single parameterized SQL query.
 * Adheres strictly to PGlite parameterized query rules:
 * - Single query statement only.
 */
export async function query<T = any>(sqlText: string, params?: unknown[]): Promise<QueryResult<T>> {
  await getDbClient();

  const start = Date.now();

  if (pgPool) {
    const res = await pgPool.query(sqlText, params);
    const duration = Date.now() - start;
    logger.debug?.('Executed PG query', { sqlText, duration, rowCount: res.rowCount });
    return {
      rows: res.rows as T[],
      rowCount: res.rowCount ?? res.rows.length
    };
  }

  if (pgliteInstance) {
    const res = await pgliteInstance.query<T>(sqlText, params);
    const duration = Date.now() - start;
    logger.debug?.('Executed PGlite query', { sqlText, duration, rowCount: res.rows.length });
    return {
      rows: res.rows,
      rowCount: (res as any).affectedRows ?? res.rows.length
    };
  }

  throw new Error('Database client not initialized');
}

/**
 * Execute multi-statement SQL text.
 * Strictly uses db.exec() for PGlite as mandated.
 */
export async function exec(sqlText: string): Promise<void> {
  await getDbClient();

  if (pgPool) {
    await pgPool.query(sqlText);
    return;
  }

  if (pgliteInstance) {
    await pgliteInstance.exec(sqlText);
    return;
  }

  throw new Error('Database client not initialized');
}

export async function checkDatabaseHealth(): Promise<'connected' | 'unconfigured' | 'error'> {
  try {
    await getDbClient();
    const res = await query('SELECT 1 as healthy');
    return res.rows.length > 0 ? 'connected' : 'error';
  } catch (err) {
    logger.warn('Database health check failed:', err instanceof Error ? err.message : 'Unknown database error');
    return 'error';
  }
}

export { isConfigured, isInitialized };
