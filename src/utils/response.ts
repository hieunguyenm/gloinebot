import axios from 'axios';

import {
  apiURL,
  HELP_URL,
} from './constants';

import {
  generateButtonSets,
  generateConfirmURL,
} from './generator';

import { IBookRequest } from '../app.rooms';

export const respondNone = (id: string) =>
  respond(id, 'Sorry, there are no rooms available at this time.');

export const respondUnknown = (id: string) => respond(id,
  [
    `Give me a time like "4pm" and I will try find a glassroom for you!`,
    `You can also give me an interval like "4pm for 2 hours" as well!`,
    `See ${HELP_URL} for examples.`,
  ].join('\n')
);

export const respondAlternative = (req: IBookRequest) => {
  respond(req.id, [
    `Room ${req.want} is not available for this time.`,
    `These other rooms are available:`,
  ].join('\n'));
  respondButtonTemplate(req);
};

export const respondConfirm =
  (id: string, room: number, start: number, end: number, _date: string) => {
    respond(id,
      [
        `Room ${room}, `,
        `${_date} @ ${start}:00-${end}:00\n`,
        `${generateConfirmURL(room, start, end, _date)}\n\n`,
        `Click link to confirm booking.`
      ].join(''));
  };

export const respondButtonTemplate = async (req: IBookRequest) => {
  const buttonSets =
    generateButtonSets(req.rooms, req.start, req.end, req.date);
  for (let e of buttonSets) {
    await axios.post(apiURL(process.env.PAGE_ACCESS_TOKEN), {
      recipient: { id: req.id },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: `${req.date} @ ${req.start}:00-${req.end}:00`,
            buttons: e,
          },
        },
      },
    }).catch(e =>
      console.log(`Failed to send response to user ${req.id}: ${e}`));
  }
};

export const respondBadRequest = (id: string) =>
  respond(id, [
    'I did not recognise the booking interval.\n',
    'The requested start time may have already passed or the time is invalid.'
  ].join(''));

export const respond = (id: string, msg: string) =>
  axios.post(apiURL(process.env.PAGE_ACCESS_TOKEN), {
    messaging_type: 'RESPONSE',
    recipient: { id },
    message: { text: msg }
  }).catch(e => console.log(`Failed to send response to user ${id}: ${e}`));
