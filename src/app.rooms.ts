import {
  extractBookingTimes,
  filterOccupied,
} from './utils/parser';

import {
  respondAlternative,
  respondButtonTemplate,
} from './utils/response';

export const iterateRequest =
  async (datetimes: JSON, id: string, wanted: number): Promise<boolean> => {
    for (let i in datetimes) {
      let times = extractBookingTimes(datetimes[i]);
      let rooms = await filterOccupied(times.date, times.start)
      if (rooms.length > 0) { bookRoom(id, rooms, wanted, times.date, times.start, times.end); return true; }
    }
    return false;
  };

const bookRoom =
  (id: string, rooms: number[], wanted: number | null, date: string, start: number, end: number) => {
    if (wanted !== null && rooms.every(e => e !== wanted))
      respondAlternative(id, wanted, rooms, start, end, date);
    else respondButtonTemplate(id, wanted ? [wanted] : rooms, start, end, date);
  };
