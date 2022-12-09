import jwt from 'jsonwebtoken';
import sanitizedConfig from '../config';

async function verifyToken(token: string): Promise<number> {
  const { userId } = jwt.verify(token, sanitizedConfig.JWT_SECRET) as {
    userId: number;
  };

  return userId;
}

export default verifyToken;
