import { Injectable, HttpStatus } from '@nestjs/common';
import { iterateRequest } from './app.rooms';
import { extractRoomWanted } from './utils/parser';

import {
  getUserName,
  log,
} from './utils/helper';

import {
  getDatetime,
  getSenderID,
  hasSticker,
  getMessage,
} from './utils/extractor';

import {
  respondNone,
  respondUnknown,
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

  async processMessage(body: JSON) {
    const id = getSenderID(body);
    const datetimes = getDatetime(body);
    const wantedRoom = extractRoomWanted(body);
    const name = await getUserName(id);
    log(`ID ${id} ${name ? '(' + name + ')' : ''}: "${getMessage(body)}"`);

    if (datetimes)
      iterateRequest(getMessage(body), datetimes, id, wantedRoom)
        .then(successful => { if (!successful) respondNone(id) });
    else if (!hasSticker(body)) respondUnknown(getSenderID(body));
  }
}
