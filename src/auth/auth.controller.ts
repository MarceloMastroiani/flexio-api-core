import { Controller, Get, Post, Body, HttpCode, Param } from '@nestjs/common';
import { LoginDto } from './dto/login-auth.dto';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { User } from 'generated/prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  // ============================================================
  // AUTHENTICATION
  // ============================================================

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto): Promise<User> {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  // ============================================================
  // USER
  // ============================================================
  @Post()
  @HttpCode(201)
  createUser(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.createUser(createAuthDto);
  }

  @Get()
  @HttpCode(200)
  findAllUsers() {
    return this.authService.findAllUsers();
  }

  @Get(':id')
  @HttpCode(200)
  findOneUser(@Param('id') id: string) {
    return this.authService.findOneUser(id);
  }
}
