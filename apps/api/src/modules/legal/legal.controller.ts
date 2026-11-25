import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/auth.decorators.js';
import { LegalService } from './legal.service.js';

@ApiTags('legal')
@Public()
@Controller('legal')
export class LegalController {
  constructor(private readonly legal: LegalService) {}

  @Get('tratamiento-datos')
  tratamientoDatos() {
    return this.legal.tratamientoDatos();
  }
}
