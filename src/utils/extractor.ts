export const getSenderID = (data: JSON): string => data['entry'][0]['messaging'][0]['sender']['id'];

export const hasSticker = (data: JSON): boolean =>
  data['entry'][0]['messaging'][0]['message']['sticker_id'];

export const getMessage = (data: JSON): string =>
  data['entry'][0]['messaging'][0]['message']['text'];

export const getDatetime = (data: JSON): JSON => {
  try {
    return data['entry'][0]['messaging'][0]['message']['nlp']['entities']['datetime'];
  } catch {
    return null;
  }
};
