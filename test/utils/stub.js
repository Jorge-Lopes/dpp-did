import { httpClient } from '@digitalbazaar/http-client';
import sinon from 'sinon';

export const stubRequest = ({ url, data }) => {
  const stub = sinon.stub(httpClient, 'get');
  stub.withArgs(url, sinon.match.any).returns({ data });
  return stub;
};
