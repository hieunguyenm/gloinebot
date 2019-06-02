export const btoa = (str: string): string => Buffer.from(str).toString('base64');

export const isOccupied = (aStart: number, aEnd: number, bStart: number, bEnd: number): boolean =>
  !(aEnd <= bStart || aStart >= bEnd);

export const split = <T>(list: T[], size: number): T[][] =>
  list.reduce((acc, _, i, self) =>
    !(i % size) ?
      [...acc, self.slice(i, i + size)] :
      acc,
    []);
