import { apiURL } from '../src/utils/constants';

test('test API URL', () => {
  expect(apiURL('abc123'))
    .toBe('https://graph.facebook.com/v3.2/me/messages?access_token=abc123');
});