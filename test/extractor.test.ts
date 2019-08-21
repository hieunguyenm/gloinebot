import {
  getDatetime,
  getMessage,
  getSenderID,
  hasSticker,
} from '../src/utils/extractor';

test('test get sender ID', () => {
  const id: number = 123456789;
  const data: any = {
    entry: [{
      messaging: [{
        sender: { id },
      }],
    }],
  };
  expect(getSenderID(<JSON>data)).toBe(id);
});

test('test has sticker', () => {
  interface stickerTest {
    want: boolean;
    input: any;
  }
  const tests: stickerTest[] = [
    {
      want: true,
      input: {
        entry: [{
          messaging: [{
            message: {
              sticker_id: {},
            },
          }],
        }],
      },
    },
    {
      want: false,
      input: {
        entry: [{
          messaging: [{
            message: {
              not_sticker: {},
            },
          }],
        }],
      },
    },
  ];
  tests.forEach(e => {
    if (e.want) expect(hasSticker(<JSON>e.input)).toBeTruthy();
    else expect(hasSticker(<JSON>e.input)).toBeFalsy();
  });
});

test('test get message', () => {
  const data: any = {
    entry: [{
      messaging: [{
        message: {
          text: 'this is a test',
        },
      }],
    }],
  };
  expect(getMessage(<JSON>data)).toBe('this is a test');
});

test('test get datetime', () => {
  interface datetimeTest {
    want: object | null;
    input: any;
  }
  const tests: datetimeTest[] = [
    {
      want: {
        from: '',
        to: '',
      },
      input: {
        entry: [{
          messaging: [{
            message: {
              nlp: {
                entities: {
                  datetime: {
                    from: '',
                    to: '',
                  },
                },
              },
            },
          }],
        }],
      },
    },
    {
      want: null,
      input: {
        entry: [{
          messaging: [{
            message: {
              not_datetime: {},
            },
          }],
        }],
      },
    },
  ];
  tests.forEach(e => {
    expect(getDatetime(<JSON>e.input)).toStrictEqual(e.want);
  });
});