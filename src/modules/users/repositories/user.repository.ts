import { DataSource } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findUserWithEmail(email: string) {
    return await this.findOne({
      where: { email: email },
    });
  }

  async findUserWithId(id: string) {
    return await this.findOne({
      where: { id: id },
    });
  }
}
