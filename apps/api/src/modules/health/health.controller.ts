import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import { Public } from '../../common/auth.decorators.js';
import { type Database, InjectDb } from '../../database/database.module.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectDb() private readonly db: Database) {}

  @Public()
  @Get()
  async check() {
    await this.db.execute(sql`select 1`);
    return { status: 'ok', db: 'up', time: new Date().toISOString() };
  }
}
