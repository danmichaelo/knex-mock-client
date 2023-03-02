import { Knex } from 'knex';
import { Tracker } from './Tracker';

export { MockClient } from './MockClient';
export type { Tracker } from './Tracker';
export type { RawQuery, QueryMatcher, FunctionQueryMatcher } from '../types/mock-client';

export function getTracker(db: Knex): Tracker {
  if (!db.client.tracker) {
    throw new Error('Knex instance is not mocked');
  }

  return db.client.tracker;
}
