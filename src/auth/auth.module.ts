import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresInSeconds = Number(
          configService.get<string>('JWT_EXPIRES_IN_SECONDS', '604800'),
        );

        return {
          secret: configService.get<string>('JWT_SECRET', 'dev-secret'),
          signOptions: {
            expiresIn: Number.isNaN(expiresInSeconds)
              ? 604800
              : expiresInSeconds,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
