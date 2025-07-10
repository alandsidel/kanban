// Created via the express-session docs and the connect-redis MIT licensed middleware
import { consts } from '../consts.mjs';
import knex from 'knex';
import { SessionData, Store } from 'express-session';

const noop = (_err?: unknown, _data?: any) => {}

type KnexSessionStoreOpts = {
  db: knex.Knex<any, unknown[]>,
  table: string,
  lifetime: number,
};

export class KnexSessionStore extends Store {
  db: knex.Knex<any, unknown[]>;
  lifetime: number = 600;
  table: string = 'sessions';

  private _getExpirationLimit() {
    return Math.floor(new Date().getTime() / 1000) + (consts.SESSION_LEN as number);
  }

  private async _garbageCollect() {
    // 1% chance of cleaning garbage
    if (Math.random() <= 0.01) {
      await this.db(this.table)
        .where('expiration', '<', this._getExpirationLimit())
        .delete();
    }
  }

  constructor(opts:KnexSessionStoreOpts) {
    super();
    this.db = opts.db;
    this.lifetime = opts.lifetime;
    this.table = opts.table;
  }

  async get(sid: string, cb = noop) {
    await this._garbageCollect();
    try {
      const row = await this.db(this.table)
        .select('data')
        .where({id: sid})
        .andWhere('expiration', '<=', this._getExpirationLimit())
        .first();
      if (!row) {
        return cb();
      } else {
        return cb(null, JSON.parse(row.data));
      }
    } catch (e) {
      return cb(e);
    }
  }

  async set(sid: string, data: SessionData, cb = noop) {
    await this._garbageCollect();
    try {
      if (['pg', 'pg-native'].includes(this.db.client.config.client.toLowerCase())) {
        // Only pg based Knex connections have upsert
        await this.db(this.table)
          .upsert({
            id: sid,
            data: JSON.stringify(data),
            expiration: this._getExpirationLimit()
          });
      } else {
        const res = await this.db(this.table)
          .update({
            data: JSON.stringify(data),
            expiration: this._getExpirationLimit()
          })
        .where({id: sid});

        if (!res) {
          await this.db(this.table).insert({
            id: sid,
            data: JSON.stringify(data),
            expiration: this._getExpirationLimit()
          });
        }
        return cb();
      }
    } catch (e) {
      return cb(e);
    }
  }

  async touch(sid: string, _data: SessionData, cb = noop) {
    try {
      await this.db(this.table)
        .update({expiration: this._getExpirationLimit()})
        .where({id: sid});
      return cb();
    } catch (e) {
      return cb(e);
    }
  }

  async destroy(sid: string, cb = noop) {
    try {
      await this.db(this.table)
        .where({id: sid})
        .delete();
      return cb();
    } catch (e) {
      return cb(e);
    }
  }

  async clear(cb = noop) {
    try {
      await this.db(this.table).delete();
      return cb();
    } catch (e) {
      return cb(e);
    }
  }

  async length(cb = noop) {
    try {
      const res = await this.db(this.table).count('id as count').first();
      if (res) {
        return cb(null, res.count);
      } else {
        return cb('Failed to count sessions');
      }
    } catch (e) {
      return cb(e);
    }
  }

  async ids(cb = noop) {
    try {
      const rows = await this.db(this.table)
        .select('id');
      return cb(null, rows.map((k) => k.id));
    } catch (e) {
      return cb(e);
    }
  }
};
