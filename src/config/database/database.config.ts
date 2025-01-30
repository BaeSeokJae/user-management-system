import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const createDataSourceOptions = (
  configService: ConfigService,
): DataSourceOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get('DB_USER'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE'),
  namingStrategy: new SnakeNamingStrategy(),
  entities: ['dist/**/entities/*.entity{.js,.ts}'],
  migrations: ['dist/src/migrations/*{.js,.ts}'],
  migrationsTableName: 'migrations',
  synchronize: false,
  migrationsRun: configService.get('MIGRATE_RUN') === 'true',
  logging: false,
  maxQueryExecutionTime: 1000,
});
