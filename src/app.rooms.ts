import {
  extractBookingTimes,
  filterOccupied,
} from './utils/parser';

import {
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
      let rooms = await filterOccupied(times.date, times.start)
      if (rooms.length > 0) { bookRoom(id, rooms, wanted, times.date, times.start, times.end); return true; }
    }
    if (badRequest) { respondBadRequest(id); return true; }
    return false;
  };

const bookRoom =
  (id: string, rooms: number[], wanted: number | null, date: string, start: number, end: number) => {
    if (wanted !== null && rooms.every(e => e !== wanted))
      respondAlternative(id, wanted, rooms, start, end, date);
    else respondButtonTemplate(id, wanted ? [wanted] : rooms, start, end, date);
  };
