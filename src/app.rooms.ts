import {
  extractBookingTimes,
  filterOccupied,
} from './utils/parser';

import {
  respond,
  respondAlternative,
  respondBadRequest,
  respondButtonTemplate,
} from './utils/response';

export const iterateRequest =
  async (datetimes: JSON, id: string, wanted: number): Promise<boolean> => {
    let badRequest: boolean;
    for (let i in datetimes) {
      let times = extractBookingTimes(datetimes[i]);
      if (!times) { badRequest = true; break; }

      respond(id, 'Looking for available rooms...');
      let rooms = await filterOccupied(times.date, times.start, times.end);
      if (rooms.length > 0) {
        bookRoom(id, rooms, wanted, times.date, times.start, times.end);
        return true;
      }
    }
    if (badRequest) { respondBadRequest(id); return true; }
    return false;
  };

const bookRoom =
  (id: string, rooms: number[], want: number | null, date: string, start: number, end: number) => {
    if (want !== null && rooms.every(e => e !== want))
      respondAlternative(id, want, rooms, start, end, date);
    else respondButtonTemplate(id, want ? [want] : rooms, start, end, date);
  };
