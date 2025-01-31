import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { createDataSourceOptions } from './database.config';

config();

const configService = new ConfigService();
const dataSourceOptions = createDataSourceOptions(configService);

export default new DataSource(dataSourceOptions);
