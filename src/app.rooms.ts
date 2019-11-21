import { ONE_HOUR_REGEX } from './utils/constants';
import { log } from './utils/helper';

import {
  extractBookingTimes,
  filterOccupied,
  retrieveBookings,
} from './utils/parser';

import {
  respond,
  respondAlternative,
  respondBadRequest,
  respondButtonTemplate,
} from './utils/response';

export interface IBookRequest {
  id: string;
  rooms: number[];
  want: number | null;
  date: string;
  start: number;
  end: number;
};

export const iterateRequest =
  async (msg: string, dt: JSON, id: string, wanted: number):
    Promise<boolean> => {
    let badRequest: boolean;
    for (let i in dt) {
      let times = extractBookingTimes(dt[i]);
      if (!times) { badRequest = true; break; }

      log(`NLP ${id}: ${JSON.stringify(times, null, 2)}`);
      if (msg.match(ONE_HOUR_REGEX) && times.end - times.start > 1) {
        times.end--;
        log(`Modified NLP ${id}: ${JSON.stringify(times, null, 2)}`);
      }

      respond(id, 'Looking for available rooms...');
      let rooms = await filterOccupied(times.date, times.start, times.end);
      if (rooms.length > 0) {
        bookRoom({
          id: id,
          rooms: rooms,
          want: wanted,
          date: times.date,
          start: times.start,
          end: times.end,
        });
        return true;
      }
    }
    if (badRequest) { respondBadRequest(id); return true; }
    return false;
  };

export const findExistingBooking = async (id: string, name: string) => {
  const exist = await retrieveBookings(name);
  if (!exist) {
    const failMessage = [
      `Sorry, I couldn't find an existing booking for you.\n`,
      'Please note: for this feature to work, ',
      'make sure your name with SCSS is the same as on Facebook.',
    ].join('');
    respond(id, failMessage);
  } else {
    const msg = [
      `You have a booking on ${exist.date} @`,
      `${exist.start}:00-${exist.end}:00`,
      `for room ${exist.room}.`,
    ].join(' ');
    respond(id, msg);
  }
};

const bookRoom = (req: IBookRequest) => {
  if (req.want !== null && req.rooms.every(e => e !== req.want))
    respondAlternative(req);
  else respondButtonTemplate(req);
};
