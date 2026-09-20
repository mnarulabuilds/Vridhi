import { BadRequestException } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  function mockHost() {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const request = { method: 'GET', url: '/x', headers: { 'x-request-id': 'req-1' } };
    return {
      json,
      status,
      host: {
        switchToHttp: () => ({
          getResponse: () => ({ status }),
          getRequest: () => request,
        }),
      } as any,
    };
  }

  it('formats HttpException responses', () => {
    const { host, status, json } = mockHost();
    filter.catch(new BadRequestException('nope'), host);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, message: 'nope', requestId: 'req-1' }),
    );
  });

  it('hides unknown errors as 500', () => {
    const { host, status, json } = mockHost();
    filter.catch(new Error('boom'), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, message: 'Internal server error' }),
    );
  });
});
