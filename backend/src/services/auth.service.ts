import crypto from 'crypto';
import { User, UserRole, LoginRequestBody, AuthResponse } from '../types/index.js';
import { generateToken } from '../utils/jwt.js';

interface DemoAccount {
  username: string;
  passwordHash: string; // Secure SHA-256 hash of demo password
  role: UserRole;
  user: User;
}

// Single common demo password: admin@123 (hashed with SHA-256)
const COMMON_DEMO_HASH = crypto.createHash('sha256').update('admin@123').digest('hex');

const DEMO_ACCOUNTS: Record<string, DemoAccount> = {
  student: {
    username: 'student',
    passwordHash: COMMON_DEMO_HASH,
    role: 'STUDENT',
    user: {
      id: 'usr_std_9021',
      username: 'student',
      role: 'STUDENT',
      displayName: 'Alex Mercer (Student)',
      email: 'student@campus.internhub.edu',
      department: 'Computer Science & Engineering',
      systemPermissions: ['VIEW_INTERNSHIPS', 'SUBMIT_APPLICATIONS', 'VIEW_PORTFOLIO']
    }
  },
  company: {
    username: 'company',
    passwordHash: COMMON_DEMO_HASH,
    role: 'COMPANY',
    user: {
      id: 'usr_cmp_4410',
      username: 'company',
      role: 'COMPANY',
      displayName: 'Nexus Dynamics Recruiter',
      email: 'talent@nexusdynamics.tech',
      companyName: 'Nexus Dynamics Labs',
      systemPermissions: ['POST_INTERNSHIPS', 'REVIEW_CANDIDATES', 'MANAGE_LISTINGS']
    }
  },
  admin: {
    username: 'admin',
    passwordHash: COMMON_DEMO_HASH,
    role: 'ADMIN',
    user: {
      id: 'usr_adm_0001',
      username: 'admin',
      role: 'ADMIN',
      displayName: 'Campus Placement Admin',
      email: 'dean.placement@internhub.edu',
      department: 'Central Career & Placement Directorate',
      systemPermissions: ['SYSTEM_MONITORING', 'MODERATE_ACCOUNTS', 'AUDIT_LOGS', 'CONFIGURE_POLICIES']
    }
  }
};

const EMAIL_ALIAS_MAP: Record<string, string> = {
  'student@campus.internhub.edu': 'student',
  'student@internhub.edu': 'student',
  'talent@nexusdynamics.tech': 'company',
  'company@internhub.edu': 'company',
  'dean.placement@internhub.edu': 'admin',
  'admin@internhub.edu': 'admin'
};

export class AuthService {
  public static authenticate(credentials: LoginRequestBody): AuthResponse {
    const { username, password, role } = credentials;

    if (!username || !password) {
      throw {
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid username, password, or role.'
      };
    }

    const trimmedInput = username.trim().toLowerCase();
    const resolvedUsername = EMAIL_ALIAS_MAP[trimmedInput] || trimmedInput;
    const account = DEMO_ACCOUNTS[resolvedUsername];

    if (!account) {
      throw {
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid username, password, or role.'
      };
    }

    const inputHash = crypto.createHash('sha256').update(password).digest('hex');
    const trimmedInputHash = crypto.createHash('sha256').update(password.trim()).digest('hex');
    const matchesPassword = inputHash === account.passwordHash || trimmedInputHash === account.passwordHash;
    if (!matchesPassword) {
      throw {
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid username, password, or role.'
      };
    }

    if (role) {
      const normalizedRole = role.toString().trim().toUpperCase();
      if (account.role !== normalizedRole) {
        throw {
          status: 401,
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username, password, or role.'
        };
      }
    }

    const token = generateToken(account.user);

    return {
      success: true,
      message: `Authentication successful. Session initialized for ${account.user.displayName}.`,
      token,
      user: account.user,
      issuedAt: new Date().toISOString()
    };
  }

  public static getAccountByUsername(username: string): User | null {
    const normalized = username.trim().toLowerCase();
    const resolved = EMAIL_ALIAS_MAP[normalized] || normalized;
    const account = DEMO_ACCOUNTS[resolved];
    return account ? account.user : null;
  }
}
