import { Injectable, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { differenceInHours, format, parse, subHours } from 'date-fns';

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
    // else if (getEntities(body) && getDatetime(body)) book(getDatetime(body));
    else respondUnknown(getSenderID(body));
  }
}

const getSticker = (data: JSON): JSON => data['entry'][0]['messaging'][0]['message']['sticker_id'];

const getEntities = (data: JSON): JSON => data['entry'][0]['messaging'][0]['message']['nlp']['entities'];

const getDatetime = (data: JSON): JSON => getEntities(data)['datetime'];

const printMessage = (data: JSON) => console.log(JSON.stringify(data['entry'][0]['messaging'][0]['message'], null, 2));

const getSenderID = (data: JSON): string => data['entry'][0]['messaging'][0]['sender']['id']

const respondUnknown = (id: string) =>
  axios.post('https://graph.facebook.com/v3.2/me/messages?access_token=' + process.env.PAGE_ACCESS_TOKEN, {
    messaging_type: 'RESPONSE',
    recipient: { id: id },
    message: { text: 'Sorry, I did not recognise your request.' }
  });
