import { Request } from 'express';
import { UserRole } from 'src/modules/users/entities/user.entity';

export interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}
