export const ROOM_REGEX = /room\s?(number)?(no\.?)?\s?(\d)/;

export const ONE_HOUR_REGEX = /(for\s)?((1|one)\s?(hour|h))/;

export const CONFIRM_URL = 'https://confirm-gloinebot.now.sh';

export const HELP_URL = 'https://gloinebot.sixth.io';

export const GLASSROOM_API = 'https://gb.sixth.io/v1/rooms/all';

export const ALL_ROOMS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const apiURL = (token: string) =>
  `https://graph.facebook.com/v3.2/me/messages?access_token=${token}`;
