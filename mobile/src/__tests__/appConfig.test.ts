import { MOBILE_APP_ID } from '@buggybooks/contracts';
import config from '../../app.config';

describe('app.config.ts', () => {
  it('uses the Android application ID from the contracts (Maestro appId)', () => {
    expect(config.android?.package).toBe(MOBILE_APP_ID);
  });

  it('targets Android only', () => {
    expect(config.platforms).toEqual(['android']);
  });
});
