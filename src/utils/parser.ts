import axios from 'axios';

import {
  addHours,
  differenceInHours,
  format,
  parse,
  subHours
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

    // Subtract 1 hour because Messenger NLP says 2pm-5pm (3 hours) for messages like "2pm for 2 hours".
    let tTo = subHours(parse(date['to']['value']), 1);
    duration = Math.max(Math.min(differenceInHours(tTo, tFrom), 2), 1);
    tTo = addHours(tFrom, duration);
    parsedTime = formatDatetime(tFrom, tFrom, tTo);
  } else return null;
  return parsedTime;
}

export const filterOccupied = async (date: string, start: number): Promise<number[]> =>
  axios.get(GLASSROOM_API)
    .then(res => {
      if (date in res.data) return ALL_ROOMS.filter(roomIndex => {
        return res.data[date].every((r: any) => {
          const roomInfo = parseRoomInfo(r);
          return !(roomInfo.room === roomIndex && isOccupied(start, roomInfo.start, roomInfo.end));
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

export const parseRoomInfo = (d: JSON): any => {
  const interval = d['time'].split('-');
  const bookedStart = parseInt(interval[0].substring(0, 2));
  const bookedEnd = parseInt(interval[1].substring(0, 2));
  const roomNumber = d['room'];
  return { start: bookedStart, end: bookedEnd, room: roomNumber };
};
