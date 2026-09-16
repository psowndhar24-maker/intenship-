import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { query } from '../db/index.js';
import { StudentService } from './student.service.js';

// Backend-controlled secure storage paths outside public frontend
const RESUMES_DIR = path.resolve(process.cwd(), 'data', 'uploads', 'resumes');
const APPLICATIONS_DIR = path.resolve(process.cwd(), 'data', 'uploads', 'applications');

// Ensure storage directories exist
try {
  fs.mkdirSync(RESUMES_DIR, { recursive: true });
  fs.mkdirSync(APPLICATIONS_DIR, { recursive: true });
} catch (err) {
  console.error('Error creating document storage directories:', err);
}

// Path traversal defense helper
export function assertPathWithinDir(targetPath: string, allowedDir: string): void {
  const resolvedTarget = path.resolve(targetPath);
  const resolvedDir = path.resolve(allowedDir);
  if (!resolvedTarget.startsWith(resolvedDir)) {
    const err: any = new Error('Access denied: Path traversal detected.');
    err.status = 403;
    err.code = 'ACCESS_DENIED';
    throw err;
  }
}

// Multer storage setup for student resumes
const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, RESUMES_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeRandom = crypto.randomBytes(16).toString('hex');
    cb(null, `resume_${Date.now()}_${safeRandom}${ext}`);
  },
});

export const resumeUploadMiddleware = multer({
  storage: resumeStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.pdf', '.doc', '.docx'];
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedExts.includes(ext) || !allowedMimes.includes(file.mimetype)) {
      const err: any = new Error('Invalid file type. Only PDF, DOC, and DOCX files up to 5MB are permitted.');
      err.status = 400;
      err.code = 'INVALID_FILE_TYPE';
      return cb(err);
    }
    cb(null, true);
  },
});

export interface DocumentRecord {
  id: string;
  student_id?: string;
  application_id?: string;
  document_type: string;
  original_filename: string;
  stored_filename: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
  updated_at?: string;
}

export class DocumentService {
  /**
   * Save or replace authenticated student's profile resume
   */
  public static async saveStudentResume(
    userId: string,
    file: Express.Multer.File
  ): Promise<DocumentRecord> {
    const profile = await StudentService.getProfile(userId);

    // Sanitize original filename
    const sanitizedOriginalName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 200);

    // Verify file exists on disk
    assertPathWithinDir(file.path, RESUMES_DIR);

    // Check for existing active resume
    const existing = await query<DocumentRecord>(
      `SELECT * FROM student_documents 
       WHERE student_id = $1 AND document_type = 'RESUME' 
       ORDER BY created_at DESC LIMIT 1`,
      [profile.id]
    );

    // If an existing resume exists, remove old physical file to preserve disk space
    if (existing.rows.length > 0) {
      const oldDoc = existing.rows[0];
      try {
        if (fs.existsSync(oldDoc.storage_path)) {
          assertPathWithinDir(oldDoc.storage_path, RESUMES_DIR);
          fs.unlinkSync(oldDoc.storage_path);
        }
      } catch (err) {
        console.warn('Notice: Could not unlink old resume file:', err);
      }
      // Delete old document record
      await query('DELETE FROM student_documents WHERE id = $1', [oldDoc.id]);
    }

    const docId = `sdoc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const insertSql = `
      INSERT INTO student_documents (
        id, student_id, document_type, original_filename, 
        stored_filename, mime_type, file_size, storage_path, 
        created_at, updated_at
      ) VALUES ($1, $2, 'RESUME', $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const result = await query<DocumentRecord>(insertSql, [
      docId,
      profile.id,
      sanitizedOriginalName,
      file.filename,
      file.mimetype,
      file.size,
      file.path,
    ]);

    // Keep student_profiles.resume_url updated with the secure endpoint for backward compatibility
    await query(
      `UPDATE student_profiles 
       SET resume_url = '/api/students/resume/view', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [profile.id]
    );

    return result.rows[0];
  }

  /**
   * Retrieve active resume document metadata for student
   */
  public static async getStudentResume(userId: string): Promise<DocumentRecord | null> {
    const profile = await StudentService.getProfile(userId);
    const result = await query<DocumentRecord>(
      `SELECT id, student_id, document_type, original_filename, stored_filename, mime_type, file_size, created_at, updated_at
       FROM student_documents 
       WHERE student_id = $1 AND document_type = 'RESUME' 
       ORDER BY created_at DESC LIMIT 1`,
      [profile.id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Retrieve active resume file for streaming
   */
  public static async getStudentResumeFile(
    userId: string
  ): Promise<{ doc: DocumentRecord; absolutePath: string }> {
    const profile = await StudentService.getProfile(userId);
    const result = await query<DocumentRecord>(
      `SELECT * FROM student_documents 
       WHERE student_id = $1 AND document_type = 'RESUME' 
       ORDER BY created_at DESC LIMIT 1`,
      [profile.id]
    );

    if (result.rows.length === 0) {
      const err: any = new Error('No resume file found on your student profile.');
      err.status = 404;
      err.code = 'RESUME_NOT_FOUND';
      throw err;
    }

    const doc = result.rows[0];
    const absolutePath = path.resolve(doc.storage_path);
    assertPathWithinDir(absolutePath, RESUMES_DIR);

    if (!fs.existsSync(absolutePath)) {
      const err: any = new Error('Resume file storage record exists, but file is missing on server.');
      err.status = 404;
      err.code = 'FILE_NOT_FOUND';
      throw err;
    }

    return { doc, absolutePath };
  }

  /**
   * Remove student's profile resume
   */
  public static async deleteStudentResume(userId: string): Promise<boolean> {
    const profile = await StudentService.getProfile(userId);
    const result = await query<DocumentRecord>(
      `SELECT * FROM student_documents 
       WHERE student_id = $1 AND document_type = 'RESUME' 
       ORDER BY created_at DESC LIMIT 1`,
      [profile.id]
    );

    if (result.rows.length > 0) {
      const doc = result.rows[0];
      try {
        if (fs.existsSync(doc.storage_path)) {
          assertPathWithinDir(doc.storage_path, RESUMES_DIR);
          fs.unlinkSync(doc.storage_path);
        }
      } catch (err) {
        console.warn('Notice: Could not unlink deleted resume file:', err);
      }

      await query('DELETE FROM student_documents WHERE id = $1', [doc.id]);
    }

    await query(
      `UPDATE student_profiles 
       SET resume_url = NULL, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [profile.id]
    );

    return true;
  }

  /**
   * Create an application-specific resume snapshot when an application is submitted.
   * This captures the exact resume version used at application time,
   * completely isolated from future profile updates or deletions.
   */
  public static async createApplicationResumeSnapshot(
    studentId: string,
    applicationId: string
  ): Promise<DocumentRecord | null> {
    const resumeRes = await query<DocumentRecord>(
      `SELECT * FROM student_documents 
       WHERE student_id = $1 AND document_type = 'RESUME' 
       ORDER BY created_at DESC LIMIT 1`,
      [studentId]
    );

    if (resumeRes.rows.length === 0) {
      return null;
    }

    const studentDoc = resumeRes.rows[0];
    if (!fs.existsSync(studentDoc.storage_path)) {
      return null;
    }

    const appDocId = `appdoc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const ext = path.extname(studentDoc.stored_filename) || '.pdf';
    const snapshotFilename = `app_${applicationId}_${crypto.randomBytes(8).toString('hex')}${ext}`;
    const snapshotPath = path.join(APPLICATIONS_DIR, snapshotFilename);

    // Copy the file to the applications snapshot directory
    try {
      fs.copyFileSync(studentDoc.storage_path, snapshotPath);
    } catch (err) {
      console.error('Failed to copy application resume snapshot:', err);
      return null;
    }

    const insertSql = `
      INSERT INTO application_documents (
        id, application_id, document_type, original_filename, 
        stored_filename, mime_type, file_size, storage_path, created_at
      ) VALUES ($1, $2, 'RESUME', $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const insertRes = await query<DocumentRecord>(insertSql, [
      appDocId,
      applicationId,
      studentDoc.original_filename,
      snapshotFilename,
      studentDoc.mime_type,
      studentDoc.file_size,
      snapshotPath,
    ]);

    // Update application.resume_id
    await query('UPDATE applications SET resume_id = $1 WHERE id = $2', [
      appDocId,
      applicationId,
    ]);

    return insertRes.rows[0];
  }

  /**
   * Retrieve application-specific resume file for authorized viewing/download.
   * Falls back to student profile resume if application was submitted before snapshot mechanism.
   */
  public static async getApplicationResumeFile(
    applicationId: string
  ): Promise<{ doc: DocumentRecord; absolutePath: string }> {
    // 1. Check application_documents first
    const appDocRes = await query<DocumentRecord>(
      `SELECT * FROM application_documents 
       WHERE application_id = $1 AND document_type = 'RESUME' 
       ORDER BY created_at DESC LIMIT 1`,
      [applicationId]
    );

    if (appDocRes.rows.length > 0) {
      const doc = appDocRes.rows[0];
      const absolutePath = path.resolve(doc.storage_path);
      assertPathWithinDir(absolutePath, APPLICATIONS_DIR);

      if (fs.existsSync(absolutePath)) {
        return { doc, absolutePath };
      }
    }

    // 2. Backward compatibility fallback: check student's profile resume
    const fallbackRes = await query<DocumentRecord>(
      `SELECT sd.* 
       FROM applications a
       JOIN student_documents sd ON a.student_id = sd.student_id
       WHERE a.id = $1 AND sd.document_type = 'RESUME'
       ORDER BY sd.created_at DESC LIMIT 1`,
      [applicationId]
    );

    if (fallbackRes.rows.length > 0) {
      const doc = fallbackRes.rows[0];
      const absolutePath = path.resolve(doc.storage_path);
      assertPathWithinDir(absolutePath, RESUMES_DIR);

      if (fs.existsSync(absolutePath)) {
        return { doc, absolutePath };
      }
    }

    const err: any = new Error('Application resume file not found or not submitted with this application.');
    err.status = 404;
    err.code = 'DOCUMENT_NOT_FOUND';
    throw err;
  }
}
