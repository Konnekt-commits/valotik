import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';

// Configuration des utilisateurs autorisés pour RH Insertion
// En production, ces données devraient être dans la base de données
const RH_USERS = [
  {
    username: 'admin',
    // Mot de passe: Valotik2026!
    passwordHash: '$2b$10$IYdQ/X0LL.DYMtvZiDUDFe81YRsT3EvOkrkSrV9B4gRxnvBrR4I1e',
    role: 'admin'
  },
  {
    username: 'rh',
    // Mot de passe: RhInsertion2026!
    passwordHash: '$2b$10$BnZHm10QA5hbqBG/CZKjye3jrZw77B7bBv0Ys3BYc7tNM9M7IOGzW',
    role: 'user'
  }
];

// Token simple basé sur un secret et timestamp
const AUTH_SECRET = process.env.AUTH_SECRET || 'valotik-rh-insertion-secret-2026';

// Interface pour les requêtes authentifiées
export interface AuthenticatedRequest extends Request {
  user?: {
    username: string;
    role: string;
  };
}

// Générer un token simple
export const generateToken = (username: string, role: string): string => {
  const payload = {
    username,
    role,
    timestamp: Date.now(),
    secret: AUTH_SECRET
  };
  // Token simple encodé en base64
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

// Vérifier un token
export const verifyToken = (token: string): { username: string; role: string } | null => {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));

    // Vérifier le secret
    if (decoded.secret !== AUTH_SECRET) {
      return null;
    }

    // Vérifier l'expiration (24h)
    const expirationTime = 24 * 60 * 60 * 1000; // 24 heures
    if (Date.now() - decoded.timestamp > expirationTime) {
      return null;
    }

    return { username: decoded.username, role: decoded.role };
  } catch {
    return null;
  }
};

// Middleware d'authentification pour les routes RH Insertion
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré'
    });
  }

  req.user = user;
  next();
};

// Route de login
export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Nom d\'utilisateur et mot de passe requis'
    });
  }

  // Trouver l'utilisateur
  const user = RH_USERS.find(u => u.username === username);

  if (!user) {
    // Délai pour éviter les attaques par timing
    await new Promise(resolve => setTimeout(resolve, 500));
    return res.status(401).json({
      success: false,
      message: 'Identifiants incorrects'
    });
  }

  // Vérifier le mot de passe
  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    return res.status(401).json({
      success: false,
      message: 'Identifiants incorrects'
    });
  }

  // Générer le token
  const token = generateToken(user.username, user.role);

  res.json({
    success: true,
    data: {
      token,
      user: {
        username: user.username,
        role: user.role
      }
    }
  });
};

// Utilitaire pour générer des hash de mots de passe
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};
