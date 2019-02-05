import { Injectable, HttpStatus } from '@nestjs/common';
import {
  getSenderID,
  getDatetime,
  respondUnknown,
  respondNone,
  iterateRequest
} from './app.utils';

@Injectable()
export class AppService {
  verify(req: any): string {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.APP_TOKEN) {
      console.log('Webhook challenge success.')
      return req.query['hub.challenge'];
    }
    console.log('Webhook challenge failed.');
    req.res.status(HttpStatus.FORBIDDEN);
    return '';
  }

  processMessage(body: JSON) {
    const id = getSenderID(body);
    const datetimes = getDatetime(body);
    if (datetimes) iterateRequest(datetimes, id).then(successful => { if (!successful) respondNone(id) });
    else respondUnknown(getSenderID(body));
  }
}
