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

export interface IBookRequest {
  id: string;
  rooms: number[];
  want: number | null;
  date: string;
  start: number;
  end: number;
};

export const iterateRequest =
  async (datetimes: JSON, id: string, wanted: number): Promise<boolean> => {
    let badRequest: boolean;
    for (let i in datetimes) {
      let times = extractBookingTimes(datetimes[i]);
      if (!times) { badRequest = true; break; }

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

const bookRoom = (req: IBookRequest) => {
  if (req.want !== null && req.rooms.every(e => e !== req.want))
    respondAlternative(req);
  else respondButtonTemplate(req);
};
