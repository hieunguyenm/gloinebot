import axios from 'axios';

import {
  addDays,
  addHours,
  differenceInHours,
  format,
  parse,
  setHours,
  isBefore,
  startOfHour,
} from 'date-fns';

import { getMessage } from './extractor';
import { isOccupied } from './helper';

import {
  ALL_ROOMS,
  ROOM_REGEX,
  GLASSROOM_API,
} from './constants';

interface IParsedDate {
  date: string;
  start: number;
  end: number;
};

export const extractRoomWanted = (data: JSON): number | null => {
  const roomData = getMessage(data).toLowerCase().match(ROOM_REGEX);
  const wanted = (roomData) ? parseInt(roomData[3]) : null;
  return (wanted && wanted > 0 && wanted < 10) ? wanted : null;
};

export const extractBookingTimes = (date: JSON): IParsedDate | null => {
  let parsedTime: IParsedDate, duration = 1;
  if (date['type'] === 'value') {
    if (isNaN(new Date(date['value']).valueOf())) return null;
    const t = date['value'];
    parsedTime = formatDatetime(t, t, addHours(t, duration));
  } else if (date['type'] === 'interval' && date['from'] && date['to']) {
    const tFrom = parse(date['from']['value']);
    // Subtract 1 hour because Messenger NLP says 2pm-5pm (3 hours) 
    // for messages like "2pm for 2 hours".
    // let tTo = subHours(parse(date['to']['value']), 1);
    let tTo = parse(date['to']['value']);
    duration = Math.max(Math.min(differenceInHours(tTo, tFrom), 2), 1);
    tTo = addHours(tFrom, duration);
    parsedTime = formatDatetime(tFrom, tFrom, tTo);
  } else return null;
  return isBefore(toDateObj(parsedTime), startOfHour(Date.now())) ? null : parsedTime;
}

export const filterOccupied = async (date: string, start: number, end: number): Promise<number[]> =>
  axios.get(GLASSROOM_API)
    .then(res => {
      if (date in res.data) return ALL_ROOMS.filter(roomIndex => {
        return res.data[date].every((r: any) => {
          const roomInfo = parseRoomInfo(r);
          return !(roomInfo.room === roomIndex &&
            isOccupied(start, end, roomInfo.start, roomInfo.end));
        });
      });
      return ALL_ROOMS;
    })
    .catch(e => { console.log(e); return []; });

export const formatDatetime = (dateTime: Date, startTime: Date, endTime: Date): IParsedDate => {
  return {
    date: format(dateTime, 'D MMM YYYY'),
    start: parseInt(format(startTime, 'HH')),
    end: parseInt(format(endTime, 'HH'))
  };
}

const toDateObj = (bookingDate: IParsedDate): Date =>
  setHours(new Date(bookingDate.date), bookingDate.start);

export const parseRoomInfo = (d: JSON): any => {
  const interval = d['time'].split('-');
  const bookedStart = parseInt(interval[0].substring(0, 2));
  const bookedEnd = parseInt(interval[1].substring(0, 2));
  const roomNumber = d['room'];
  return { start: bookedStart, end: bookedEnd, room: roomNumber };
};

export const retrieveBookings = async (username: string): Promise<any> => {
  const currentDate = new Date();
  const currentHour = new Date().getHours();
  try {
    const res = await axios.get(GLASSROOM_API);
    const bookings = res.data;

    for (let i = 0 ; i < 8; ++i) {
      const today = format(addDays(currentDate, i), 'D MMM YYYY');
      const todaysBookings = bookings[today] || [];

      for (const b of todaysBookings) {
        const booking = parseRoomInfo(b);
        if ((i === 0 && currentHour <= booking.start || i > 0) && username === b.name) {
          return { ...booking, date: today };
        }
      }
    }
  } catch(e) {
    console.log(e);
    return null;
  }
  return null;
}
