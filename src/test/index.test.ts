import { AwsEndpoint } from '../lib';
import * as supertest from 'supertest';

describe('AwsEndpoint', () => {
  it('should reject requests for an unknown service', async () => {
    const endpoint = new AwsEndpoint('TestService', {
      test(request, response) {
        fail('should not have run');
        response.send();
      }
    });

    const result = await supertest(endpoint.app)
      .post('/')
      .set('x-amz-target', 'OtherService.test')
      .expect(400);

    expect(result.body.__type).toBe('UnknownOperationException');
  });

  it('should reject requests for an unknown action', async () => {
    const endpoint = new AwsEndpoint('TestService', {});

    const result = await supertest(endpoint.app)
      .post('/')
      .set('x-amz-target', 'TestService.test')
      .expect(400);

    expect(result.body.__type).toBe('UnknownOperationException');
  });

  it('should direct requests to the correct action', async () => {
    const endpoint = new AwsEndpoint('TestService', {
      Test(request, response) {
        expect(request.body).toEqual({ test: 1 });
        response.send();
      }
    });

    await supertest(endpoint.app)
      .post('/')
      .set('x-amz-target', 'TestService.Test')
      .set('content-type', 'application/x-amz-json-1.1')
      .send(JSON.stringify({ test: 1 }))
      .expect(200);

    expect.assertions(1);
  });
});
