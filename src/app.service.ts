import {
  Injectable,
  HttpStatus,
} from '@nestjs/common';

import { extractRoomWanted } from './utils/parser';

import {
  iterateRequest,
  findExistingBooking,
} from './app.rooms';

import {
  getUserName,
  log,
} from './utils/helper';

import {
  getDatetime,
  getSenderID,
  hasSticker,
  getMessage,
  askedForBooking,
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
    const wantedBooking = askedForBooking(body);
    const name = await getUserName(id);
    log(`ID ${id} ${name ? '(' + name + ')' : ''}: "${getMessage(body)}"`);

    if (wantedBooking) findExistingBooking(id, name);
    else if (datetimes)
      iterateRequest(getMessage(body), datetimes, id, wantedRoom)
        .then(successful => { if (!successful) respondNone(id) });
    else if (!hasSticker(body)) respondUnknown(getSenderID(body));
  }
}
