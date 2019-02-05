import { addHours, differenceInHours, format, parse, subHours } from 'date-fns';
import axios from 'axios';

interface IParsedDate {
  date: string;
  start: number;
  end: number;
};

export const getSenderID = (data: JSON): string => data['entry'][0]['messaging'][0]['sender']['id'];

export const extractBookingTimes = (date: JSON): IParsedDate => {
  let parsedTime: IParsedDate, duration = 1;
  if (date['type'] === 'value') {
    const t = date['value'];
    parsedTime = formatDatetime(t, t, addHours(t, duration));
  } else if (date['type'] === 'interval') {
    const tFrom = parse(date['from']['value']);

    // Subtract 1 hour because Messenger NLP says 2pm-5pm (3 hours) for messages like "2pm for 2 hours".
    let tTo = subHours(parse(date['to']['value']), 1);
    duration = Math.min(differenceInHours(tFrom, tTo), 2);
    tTo = addHours(tFrom, duration);
    parsedTime = formatDatetime(tFrom, tFrom, tTo);
  }
  return parsedTime;
}

export const bookRoom = (id: string, date: string, start: number, end: number): Promise<boolean> =>
  axios.get('https://gb.sixth.io/v1/rooms/all')
    .then(res => {
      if (date in res.data) {
        const availableRooms =
          [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(roomIndex => {
            let available = true;
            res.data[date].some(r => {
              const roomInfo = parseRoomInfo(r);
              if (roomInfo.room === roomIndex && isOccupied(start, roomInfo.start, roomInfo.end)) {
                available = false;
                return false;
              }
            });
            return available;
          });

        if (availableRooms.length === 1) { respondConfirm(id, availableRooms[0], start, end, date); return true; }
        else if (availableRooms.length > 1) {
          respondConfirm(id, availableRooms.find(e => e !== 4), start, end, date);
          return true;
        }
        return false;
      } else { respondConfirm(id, 1, start, end, date); return true; }
    })
    .then(status => { return status })
    .catch(e => {
      console.log(e);
      return false;
    });

export const getDatetime = (data: JSON): JSON => {
  try {
    return data['entry'][0]['messaging'][0]['message']['nlp']['entities']['datetime'];
  } catch {
    return null;
  }
};

export const respondNone = (id: string) => respond(id, 'Sorry, there are no rooms available at this time.');

export const respondUnknown = (id: string) => respond(id, 'Sorry, I did not recognise your request.');

const btoa = (str: string): string => Buffer.from(str).toString('base64');

const formatDatetime = (dateTime: Date, startTime: Date, endTime: Date): IParsedDate => {
  return {
    date: format(dateTime, 'D MMM YYYY'),
    start: parseInt(format(startTime, 'HH')),
    end: parseInt(format(endTime, 'HH'))
  };
}

const parseRoomInfo = (d: JSON): any => {
  const interval = d['time'].split('-');
  const bookedStart = parseInt(interval[0].substring(0, 2));
  const bookedEnd = parseInt(interval[1].substring(0, 2));
  const roomNumber = d['room'];
  return { start: bookedStart, end: bookedEnd, room: roomNumber };
};

const isOccupied = (aStart: number, bStart: number, bEnd: number): boolean =>
  Math.abs(aStart - bStart) === 1 && Math.abs(aStart - bEnd) === 1 ||
  Math.abs(aStart - bStart) === 0;

const respondConfirm = (id: string, room: number, start: number, end: number, _date: string) => {
  const date = new Date(_date);
  const url = 'https://confirm-gloinebot.now.sh';
  const urlParams = btoa(
    [
      `st=${start + 1}`,
      `&et=${end + 1}`,
      `&r=${room}`,
      `&d=${date.getDate()}`,
      `&m=${date.getMonth() + 1}`,
      `&y=${date.getFullYear() - new Date().getFullYear() + 1}`
    ].join(''));
  respond(id,
    [`Confirm booking for `,
      `Room ${room}, `,
      `${_date} @ ${start}:00-${end}:00\n`,
      `${url}/?d=${urlParams.slice(0, urlParams.length - 2)}`
    ].join(''));
};

const respond = (id: string, msg: string) =>
  axios.post(`https://graph.facebook.com/v3.2/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`, {
    messaging_type: 'RESPONSE',
    recipient: { id: id },
    message: { text: msg }
  })
    .catch(() => console.log(`Failed to send response to user ${id}`));
