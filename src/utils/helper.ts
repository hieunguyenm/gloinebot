export const btoa = (str: string): string => Buffer.from(str).toString('base64');

export const isOccupied = (aStart: number, bStart: number, bEnd: number): boolean =>
  Math.abs(aStart - bStart) === 1 && Math.abs(aStart - bEnd) === 1 ||
  Math.abs(aStart - bStart) === 0;

export const split = <T>(list: T[], size: number): T[][] =>
  list.reduce((acc, _, i, self) =>
    !(i % size) ?
      [...acc, self.slice(i, i + size)] :
      acc,
    []);
