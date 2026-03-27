import Knex from 'knex';
import config from '../../knexfile.js';

const env = process.env.NODE_ENV || 'development';
const db = Knex(config[env]);

export default db;
