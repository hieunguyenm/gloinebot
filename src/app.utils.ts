import {
  addHours,
  differenceInHours,
  format,
  parse,
  subHours
} from 'date-fns';

import axios from 'axios';

interface IParsedDate {
  date: string;
  start: number;
  end: number;
};

export const getSenderID = (data: JSON): string => data['entry'][0]['messaging'][0]['sender']['id'];

export const hasSticker = (data: JSON): boolean => data['entry'][0]['messaging'][0]['message']['sticker_id'];

export const getMessage = (data: JSON): string => data['entry'][0]['messaging'][0]['message']['text'];

export const iterateRequest =
  async (datetimes: JSON, id: string, wanted: number): Promise<boolean> => {
    for (let i in datetimes) {
      let times = extractBookingTimes(datetimes[i]);
      let rooms = await filterOccupied(times.date, times.start)
      if (rooms.length > 0) { bookRoom(id, rooms, wanted, times.date, times.start, times.end); return true; }
    }
    return false;
  }

export const getDatetime = (data: JSON): JSON => {
  try {
    return data['entry'][0]['messaging'][0]['message']['nlp']['entities']['datetime'];
  } catch {
    return null;
  }
};

const ROOM_REGEX = /room\s?(number)?(no\.?)?\s?(\d)/;

const CONFIRM_URL = 'https://confirm-gloinebot.now.sh';

const allRooms = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const apiURL = () => [
  `https://graph.facebook.com/v3.2/me/messages?access_token=`,
  `${process.env.PAGE_ACCESS_TOKEN}`
].join('');

export const extractRoomWanted = (data: JSON): number | null => {
  const roomData = getMessage(data).toLowerCase().match(ROOM_REGEX);
  const wanted = (roomData) ? parseInt(roomData[3]) : null;
  return (wanted && wanted > 0 && wanted < 10) ? wanted : null;
};

const extractBookingTimes = (date: JSON): IParsedDate => {
  let parsedTime: IParsedDate, duration = 1;
  if (date['type'] === 'value') {
    const t = date['value'];
    parsedTime = formatDatetime(t, t, addHours(t, duration));
  } else if (date['type'] === 'interval') {
    const tFrom = parse(date['from']['value']);

    // Subtract 1 hour because Messenger NLP says 2pm-5pm (3 hours) for messages like "2pm for 2 hours".
    let tTo = subHours(parse(date['to']['value']), 1);
    duration = Math.max(Math.min(differenceInHours(tTo, tFrom), 2), 1);
    tTo = addHours(tFrom, duration);
    parsedTime = formatDatetime(tFrom, tFrom, tTo);
  }
  return parsedTime;
}

const filterOccupied = async (date: string, start: number): Promise<number[]> =>
  axios.get('https://gb.sixth.io/v1/rooms/all')
    .then(res => {
      if (date in res.data) return allRooms.filter(roomIndex => {
        return res.data[date].every((r: any) => {
          const roomInfo = parseRoomInfo(r);
          return !(roomInfo.room === roomIndex && isOccupied(start, roomInfo.start, roomInfo.end));
        });
      });
      return allRooms;
    })
    .catch(e => { console.log(e); return []; });

const bookRoom = (id: string, rooms: number[], wanted: number | null, date: string, start: number, end: number) => {
  if (wanted !== null && rooms.every(e => e !== wanted))
    respondAlternative(id, wanted, rooms, start, end, date);
  else respondButtonTemplate(id, wanted ? [wanted] : rooms, start, end, date);
}

export const respondNone = (id: string) => respond(id, 'Sorry, there are no rooms available at this time.');

export const respondUnknown = (id: string) => respond(id,
  [
    `Give me a time like "4pm" and I will try find a glassroom for you!`,
    `You can also give me an interval like "4pm for 2 hours" as well!`,
    `See https://gloinebot.sixth.io for examples.`,
  ].join('\n')
);

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

const respondAlternative =
  (id: string, wanted: number, rooms: number[], start: number, end: number, date: string) => {
    respond(id, [
      `Room ${wanted} is not available for this time.`,
      `These other rooms are available:`,
    ].join('\n'));
    respondButtonTemplate(id, rooms, start, end, date);
  };

const generateConfirmURL = (room: number, start: number, end: number, _date: string) => {
  const date = new Date(_date);
  return `${CONFIRM_URL}/?d=` + btoa(
    [
      `st=${start + 1}`,
      `&et=${end + 1}`,
      `&r=${room}`,
      `&d=${date.getDate()}`,
      `&m=${date.getMonth() + 1}`,
      `&y=${date.getFullYear() - new Date().getFullYear() + 1}`
    ].join('')).replace(/==$/, '');
}

const respondConfirm = (id: string, room: number, start: number, end: number, _date: string) => {
  respond(id,
    [
      `Room ${room}, `,
      `${_date} @ ${start}:00-${end}:00\n`,
      `${generateConfirmURL(room, start, end, _date)}\n\n`,
      `Click link to confirm booking.`
    ].join(''));
};

const split = (list: any, size: number) =>
  list.reduce((acc, curr, i, self) => {
    if (!(i % size)) {
      return [...acc, self.slice(i, i + size)];
    }
    return acc;
  }, []);

const generateButtonSets = (rooms: number[], start: number, end: number, date: string): number[][] => {
  const roomButtons = rooms.map(room => ({
    type: 'web_url',
    url: generateConfirmURL(room, start, end, date),
    title: `Room ${room}`,
  }));
  return split(roomButtons, 3);
};

const respondButtonTemplate = async (id: string, rooms: number[], start: number, end: number, date: string) => {
  const buttons = generateButtonSets(rooms, start, end, date);
  for (let e of buttons) {
    await axios.post(apiURL(), {
      recipient: { id },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: `${date} @ ${start}:00-${end}:00`,
            buttons: e,
          },
        },
      },
    })
      .catch(e => console.log(`Failed to send response to user ${id}: ${e}`))
  }
};

const respond = (id: string, msg: string) =>
  axios.post(apiURL(), {
    messaging_type: 'RESPONSE',
    recipient: { id: id },
    message: { text: msg }
  })
    .catch(() => console.log(`Failed to send response to user ${id}`));
