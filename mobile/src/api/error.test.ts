import axios from 'axios';
import { getApiErrorMessage } from './error';

describe('getApiErrorMessage', () => {
  it('reads axios string messages', () => {
    const error = new axios.AxiosError('fail');
    error.response = { data: { message: 'Bad request' } } as never;
    expect(getApiErrorMessage(error)).toBe('Bad request');
  });

  it('joins validation array messages', () => {
    const error = new axios.AxiosError('fail');
    error.response = { data: { message: ['First', 'Second'] } } as never;
    expect(getApiErrorMessage(error)).toBe('First\nSecond');
  });

  it('falls back for unknown errors', () => {
    expect(getApiErrorMessage(new Error('x'), 'Fallback')).toBe('Fallback');
  });
});
