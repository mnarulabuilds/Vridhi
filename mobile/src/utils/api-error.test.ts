import axios from 'axios';
import { getApiErrorMessage } from '../api/error';

describe('getApiErrorMessage', () => {
  it('reads nested API message', () => {
    const error = new axios.AxiosError('fail');
    error.response = { data: { message: 'Invalid email or password' } } as never;
    expect(getApiErrorMessage(error)).toBe('Invalid email or password');
  });

  it('falls back to default', () => {
    expect(getApiErrorMessage({})).toBe('Something went wrong.');
  });
});
