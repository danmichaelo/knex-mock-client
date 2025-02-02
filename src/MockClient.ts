import knex, { Knex } from 'knex';
import { RawQuery } from '../types/mock-client';
import { MockConnection } from './MockConnection';
import { Tracker, TrackerConfig } from './Tracker';

export class MockClient extends knex.Client {
  public tracker: Tracker;
  public readonly isMock = true;

  constructor(config: Knex.Config & { mockClient: TrackerConfig }) {
    super(config);

    this.tracker = new Tracker(config.mockClient);

    if (config.dialect) {
      this._attachDialectQueryCompiler(config);
    }
  }

  public acquireConnection(): Promise<MockConnection> {
    return Promise.resolve(new MockConnection());
  }

  public releaseConnection() {
    return Promise.resolve();
  }

  public processResponse(response: any) {
    return response;
  }

  public _query(connection: MockConnection, rawQuery: RawQuery) {
    let method: RawQuery['method'] = rawQuery.method;

    const rawMethod = rawQuery.method as RawQuery['method'] | 'del' | 'first' | 'pluck' | 'raw';
    switch (rawMethod) {
      case 'first':
      case 'pluck':
        rawQuery.postOp = rawMethod;
        method = 'select';
        break;
      case 'del':
        method = 'delete';
        break;
      case 'raw':
        method = rawQuery.sql.toLowerCase().trim().split(' ').shift() as RawQuery['method'];
        break;
    }

    return this.tracker._handle(connection, { ...rawQuery, method });
  }

  private _attachDialectQueryCompiler(config: Knex.Config<any> & { mockClient: TrackerConfig }) {
    const { resolveClientNameWithAliases } = require('knex/lib/util/helpers');
    const { SUPPORTED_CLIENTS } = require('knex/lib/constants');

    if (!SUPPORTED_CLIENTS.includes(config.dialect)) {
      throw new Error(
        `knex-mock-client: Unknown configuration option 'dialect' value ${config.dialect}.\nNote that it is case-sensitive, check documentation for supported values.`
      );
    }

    const resolvedClientName = resolveClientNameWithAliases(config.dialect);
    const Dialect = require(`knex/lib/dialects/${resolvedClientName}/index.js`);
    const dialect = new Dialect(config);

    Object.setPrototypeOf(this.constructor.prototype, dialect); // make the specific dialect client to be the prototype of this class.
  }
}
