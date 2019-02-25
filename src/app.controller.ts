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
    // Messenger API expects acknowledgement of HTTP 200 for all payloads,
    // otherwise Facebook will start delay-queueing future messages.
    // Send HTTP 200 acknowledgement first, process payload after.
    res.status(HttpStatus.OK).send();
    this.appService.processMessage(body);
  }
}
