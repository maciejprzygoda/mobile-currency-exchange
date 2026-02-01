import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SummaryService } from './summary.service';

@Controller('summary')
@UseGuards(JwtAuthGuard)
export class SummaryController {
  constructor(private summary: SummaryService) {}

  @Get()
  get(@Req() req: any) {
    return this.summary.get(req.user.userId);
  }
}
