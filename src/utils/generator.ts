import { CONFIRM_URL } from './constants';

import {
  btoa,
  split,
} from './helper';

interface IMessengerButton {
  type: string;
  url: string;
  title: string;
}

export const generateButtonSets =
  (rooms: number[], start: number, end: number, date: string): IMessengerButton[][] => {
    const roomButtons = rooms.map(room => ({
      type: 'web_url',
      url: generateConfirmURL(room, start, end, date),
      title: `Book room ${room}`,
    }));
    return split(roomButtons, 3);
  };

export const generateConfirmURL = (room: number, start: number, end: number, _date: string) => {
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
