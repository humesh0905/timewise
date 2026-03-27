/**
 * Initial schema for TimeWise (ESM version)
 * @param { import('knex').Knex } knex
 */
export async function up(knex) {
  // USERS TABLE
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email').notNullable().unique();
    table.string('first_name');
    table.string('last_name');
    table.string('timezone').defaultTo('UTC');
    table.string('department');
    table.string('title');
    table.timestamps(true, true);
  });

  // ROLES TABLE
  await knex.schema.createTable('roles', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.string('description');
  });

  // USER_ROLES TABLE
  await knex.schema.createTable('user_roles', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('role_id')
      .unsigned()
      .references('id')
      .inTable('roles')
      .onDelete('CASCADE');
  });

  // CLIENTS TABLE
  await knex.schema.createTable('clients', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('contact_email');
  });

  // PROJECTS TABLE
  await knex.schema.createTable('projects', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('code').unique();
    table.integer('client_id').unsigned().references('id').inTable('clients');
    table.boolean('is_active').defaultTo(true);
  });

  // TIMESHEETS TABLE
  await knex.schema.createTable('timesheets', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users');
    table.date('week_start').notNullable();
    table.string('status').defaultTo('Saved');
    table.timestamps(true, true);
  });

  // TIMESHEET_ENTRIES TABLE
  await knex.schema.createTable('timesheet_entries', (table) => {
    table.increments('id').primary();
    table.integer('timesheet_id').unsigned().references('id').inTable('timesheets').onDelete('CASCADE');
    table.timestamp('start_time').notNullable();
    table.timestamp('end_time').notNullable();
    table.string('entry_type');
    table.string('entry_status').defaultTo('Saved');
  });

  // AUDIT_LOGS TABLE
  await knex.schema.createTable('audit_logs', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users');
    table.string('action');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

export async function down(knex) {
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('timesheet_entries');
  await knex.schema.dropTableIfExists('timesheets');
  await knex.schema.dropTableIfExists('projects');
  await knex.schema.dropTableIfExists('clients');
  await knex.schema.dropTableIfExists('user_roles');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('users');
}
