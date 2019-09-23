import { Injectable, HttpStatus } from '@nestjs/common';
import { iterateRequest } from './app.rooms';
import { extractRoomWanted } from './utils/parser';

import {
  getDatetime,
  getSenderID,
  hasSticker,
} from './utils/extractor';

import {
  respondNone,
  respondUnknown,
  respond,
} from './utils/response';

@Injectable()
export class AppService {
  verify(req: any): string {
    if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.APP_TOKEN) {
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
    const wantedRoom = extractRoomWanted(body);
    
    if (datetimes) iterateRequest(datetimes, id, wantedRoom)
      .then(successful => { if (!successful) respondNone(id) });
    else if (!hasSticker(body)) respondUnknown(getSenderID(body));
  }
}
