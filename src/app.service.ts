import { Injectable, HttpStatus } from '@nestjs/common';
import { iterateRequest } from './app.rooms';
import {
  extractRoomWanted,
  retrieveBookings
} from './utils/parser';

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
  respond,
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

    if (wantedBooking) {
      const exist = await retrieveBookings(name);
      if (!exist) {
        const failMessage =
          [ 'Sorry, I couldn\'t find an existing booking for you.',
            'Please note: for this feature to work, make sure your name with SCSS is the same as on Facebook.'
          ].join('\n');
        respond(id, failMessage);
      } else {
        const msg =
          [ `You have a booking on ${exist.date} @ ${exist.start}:00-${exist.end}:00`,
            `for room ${exist.room}.`,
          ].join(' ');
        respond(id, msg);
      }
    } else if (datetimes)
      iterateRequest(getMessage(body), datetimes, id, wantedRoom)
        .then(successful => { if (!successful) respondNone(id) });
    else if (!hasSticker(body)) respondUnknown(getSenderID(body));
  }
}
