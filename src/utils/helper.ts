import axios from 'axios';

export const btoa = (str: string): string => Buffer.from(str).toString('base64');

export const isOccupied = (aStart: number, aEnd: number, bStart: number, bEnd: number): boolean =>
  !(aEnd <= bStart || aStart >= bEnd);

export const split = <T>(list: T[], size: number): T[][] =>
  list.reduce((acc, _, i, self) =>
    !(i % size) ?
      [...acc, self.slice(i, i + size)] :
      acc,
    []);

export const getUserName = async (id: string): Promise<string | null> => {
  try {
    const res = await axios.get([
      `https://graph.facebook.com/${id}`,
      '?fields=first_name,last_name',
      `&access_token=${process.env.PAGE_ACCESS_TOKEN}`,
    ].join(''));
    if (res.data['error']) return null;
    return `${res.data['first_name']} ${res.data['last_name']}`;
  } catch (e) { return null; }
}

export const log = (msg: string) =>
  console.log(`${new Date().toUTCString()} -- ${msg}`);
