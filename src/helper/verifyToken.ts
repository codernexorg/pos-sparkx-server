import jwt from 'jsonwebtoken';
import sanitizedConfig from '../config';

async function verifyToken(token: string): Promise<number> {

  try {
    const {userId} = jwt.verify(token, sanitizedConfig.JWT_SECRET) as {
      userId: number;
    };

    return userId;
  } catch (err) {
    return -1;
  }
}

export default verifyToken;
