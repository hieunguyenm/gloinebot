import { Injectable, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import {
  addHours, differenceInHours, format, parse,
  setMilliseconds, setMinutes, setSeconds, subHours
} from 'date-fns';

@Injectable()
export class AppService {
  verify(req: any): string {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.APP_TOKEN) {
      console.log('Webhook challenge success.')
      return req.query['hub.challenge'];
    }
    console.log('Webhook challenge failed.');
    req.res.status(HttpStatus.FORBIDDEN);
    return '';
  }

  processMessage(body: JSON) {
    if (getSticker(body)) console.log(getSticker(body));
    else if (getEntities(body) && getDatetime(body)) book(getSenderID(body), getDatetime(body));
    else respondUnknown(getSenderID(body));
  }
}

const getSticker = (data: JSON): JSON => data['entry'][0]['messaging'][0]['message']['sticker_id'];

const getEntities = (data: JSON): JSON => data['entry'][0]['messaging'][0]['message']['nlp']['entities'];

const getDatetime = (data: JSON): JSON => getEntities(data)['datetime'];

const printMessage = (data: JSON) => console.log(JSON.stringify(data['entry'][0]['messaging'][0]['message'], null, 2));

const getSenderID = (data: JSON): string => data['entry'][0]['messaging'][0]['sender']['id'];

const book = (id: string, dates: JSON) => {
  for (let i in dates) {
    let date: string, start: number, end: number, length = 1;
    if (dates[i]['type'] === 'value') {
      let t = dates[i]['value'];
      date = format(t, 'D MMM YYYY');
      start = parseInt(format(t, 'HH'));
      end = parseInt(format(addHours(t, length), 'HH'));
    } else if (dates[i]['type'] === 'interval') {
      let tFrom = parse(dates[i]['from']['value']);

      // Subtract 1 hour because Messenger NLP says 2pm-5pm (3 hours) for messages like "2pm for 2 hours".
      let tTo = subHours(parse(dates[i]['to']['value']), 1);

      date = format(tFrom, 'D MMM YYYY');
      start = parseInt(format(tFrom, 'HH'));
      end = parseInt(format(tTo, 'HH'));
      if (differenceInHours(tTo, tFrom) > 1) length = 2;
    }
    bookRoom(id, date, start, end);
  }
}

const bookRoom = (id: string, date: string, start: number, end: number): Promise<void> =>
  axios.get('https://gb.sixth.io/v1/rooms/all')
    .then(res => {
      if (date in res.data) {
        let allRooms = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let j in res.data[date]) {
          console.log(res.data[date]);
          let times = res.data[date][j]['time'].split('-');
          let bookedStart = parseInt(times[0].substring(0, 2));
          let bookedEnd = parseInt(times[1].substring(0, 2));
          let room = res.data[date][j]['room'];
          if (Math.abs(start - bookedStart) === 1 && Math.abs(start - bookedEnd) === 1 ||
            Math.abs(start - bookedStart) === 0) {
            allRooms.splice(room - 1, 1);
          }
        }
        if (allRooms.length === 9) respond(id, `${date} ${start}:00-${end}:00 is available for all rooms.`);
        else {
          let availableRooms = allRooms.length > 0 ? allRooms.join(', ') : 'none';
          respond(id, `${date} ${start}:00-${end}:00\nAvailable rooms: ${availableRooms}.`)
        }
      } else respond(id, `${date} ${start}:00-${end}:00 is available for all rooms.`);
    })


const respondUnknown = (id: string) => respond(id, 'Sorry, I did not recognise your request.');

const respond = (id: string, msg: string) =>
  axios.post(`https://graph.facebook.com/v3.2/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`, {
    messaging_type: 'RESPONSE',
    recipient: { id: id },
    message: { text: msg }
  })
    .catch(() => console.log(`Failed to send response to user ${id}`));


