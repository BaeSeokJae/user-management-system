import { randomUUID } from 'node:crypto';
import { DataType, newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Token } from '../src/modules/auth/entities/token.entity';
import { TokenRepository } from '../src/modules/auth/repositories/token.repository';
import { User } from '../src/modules/users/entities/user.entity';
import { UserRepository } from '../src/modules/users/repositories/user.repository';

export const createTestDataSource = async (): Promise<DataSource> => {
  const db = newDb({
    autoCreateForeignKeyIndices: true
  });

  // Mock PostgreSQL system functions
  db.public.registerFunction({
    name: 'current_database',
    implementation: () => 'test'
  });

  db.public.registerFunction({
    name: 'version',
    implementation: () => 'PostgreSQL 13.0'
  });

  // Register UUID generation function
  db.registerExtension('uuid-ossp', (schema) => {
    schema.registerFunction({
      name: 'uuid_generate_v4',
      returns: DataType.uuid,
      implementation: randomUUID,
      impure: true
    });
  });

  db.public.interceptQueries((sql) => {
    const newSql = sql.replace(/\bnumeric\s*\(\s*\d+\s*,\s*\d+\s*\)/g, 'float');
    if (sql !== newSql) {
      return db.public.many(newSql);
    }
    return null;
  });

  db.public.interceptQueries((queryText) => {
    if (queryText.search(/(pg_views|pg_matviews|pg_tables|pg_enum)/g) > -1) {
      return [];
    }
    return null;
  });

  const dataSource = await db.adapters.createTypeormDataSource({
    type: 'postgres',
    entities: [User, Token],
    synchronize: true,
    dropSchema: true,
    namingStrategy: new SnakeNamingStrategy(),
    logging: false
  });

  await dataSource.initialize();

  const originalUserRepository = dataSource.getRepository(User);
  const customUserRepository = new UserRepository(dataSource);

  Object.getOwnPropertyNames(UserRepository.prototype)
    .filter((method) => method !== 'constructor')
    .forEach((method) => {
      originalUserRepository[method] =
        customUserRepository[method].bind(customUserRepository);
    });

  const originalTokenRepository = dataSource.getRepository(Token);
  const customTokenRepository = new TokenRepository(dataSource);

  Object.getOwnPropertyNames(TokenRepository.prototype)
    .filter((method) => method !== 'constructor')
    .forEach((method) => {
      originalTokenRepository[method] = customTokenRepository[method].bind(
        customTokenRepository
      );
    });

  // Repository를 교체
  Object.defineProperty(dataSource, 'repositories', {
    value: new Map<any, any>([
      [User, originalUserRepository],
      [Token, originalTokenRepository]
    ]),
    writable: true
  });

  return dataSource;
};

export const cleanupTestConnection = async (dataSource: DataSource) => {
  await dataSource.destroy();
};
