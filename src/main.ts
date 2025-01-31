import { VersioningType } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ credentials: true, origin: true });
  app.setGlobalPrefix('/api', { exclude: ['/'] });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  );
  app.enableVersioning({ type: VersioningType.URI });

  const packageVersion = process.env.npm_package_version as string;

  const swaggerConfig = new DocumentBuilder()
    .setTitle('User Management API')
    .setDescription('사용자 관리 시스템 API 문서')
    .setVersion(packageVersion)
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token'
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;

  await app.listen(port);
  console.log(`listening to port: ${port}`);
}
bootstrap();
