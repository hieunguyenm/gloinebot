import { Controller, Get, Req, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('hooks')
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  handleVerify(@Req() request: any): string {
    return this.appService.verify(request);
  }

  @Post()
  handleIncoming(@Res() res: any, @Body() body: JSON) {
    res.status(HttpStatus.OK).send()
    this.appService.processMessage(body);
  }
}
