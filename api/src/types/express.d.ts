// Adds the signed-in caller to Express's Request type. Set by requireAuth.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
