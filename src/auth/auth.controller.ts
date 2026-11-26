import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import { LocalAuthGuard } from '../common/guards/local-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorador';
import { RolesGuard } from '../common/guards/roles.guard';
import { SafeUser } from './dto/login-auth.dto';
import { AuthenticatedUser } from '../common/types/authenticated-user';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  // ============================================================
  // AUTHENTICATION
  // ============================================================

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req: { user: SafeUser }) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: AuthenticatedUser }) {
    return this.authService.getProfile(req.user.userId);
  }

  // Cambio de contraseña propio. No usa RolesGuard para que el flag
  // mustChangePassword no bloquee justamente esta operación.
  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  changeMyPassword(
    @Request() req: { user: AuthenticatedUser },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changeOwnPassword(
      req.user.userId,
      changePasswordDto,
    );
  }

  // ============================================================
  // USER/STAFF
  // ============================================================
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createUser(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.createUser(createAuthDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAllUsers() {
    return this.authService.findAllUsers();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findOneUser(@Param('id') id: string) {
    return this.authService.findOneUser(id);
  }

  // Reset de contraseña por ADMIN. Devuelve la temporal una única vez.
  @Patch(':id/password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  resetPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(id, resetPasswordDto);
  }
}
