import { Injectable, HttpStatus } from '@nestjs/common';
import { getSenderID, extractBookingTimes, getDatetime, respondUnknown, respondNone, bookRoom } from './app.utils';

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
    if (datetimes) {
      let promises = [];
      for (let i in datetimes) {
        let request = extractBookingTimes(datetimes[i]);
        promises.push(bookRoom(id, request.date, request.start, request.end));
      }
      Promise.all(promises)
        .then(res => { if (res.every(r => r === false)) respondNone(id) });
    }
    else respondUnknown(getSenderID(body));
  }
}
