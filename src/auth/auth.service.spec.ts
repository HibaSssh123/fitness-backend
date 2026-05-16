import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const jwtMock = {
    sign: jest.fn().mockReturnValue('token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('registers a new user and returns token', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.create.mockResolvedValueOnce({
      id: 'u1',
      email: 'user@example.com',
      name: 'User',
      password: 'hashed',
      weightKg: null,
      heightCm: null,
      calorieTarget: null,
    });

    const result = await service.register({
      email: 'user@example.com',
      password: 'password123',
      name: 'User',
    });

    expect(result.accessToken).toBe('token');
    expect(result.user.email).toBe('user@example.com');
    expect(prismaMock.user.create).toHaveBeenCalled();
  });
});
