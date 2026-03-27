/**
 * Add task model and project/task links to timesheet entries.
 * @param { import('knex').Knex } knex
 */
export async function up(knex) {
  await knex.schema.createTable('tasks', (table) => {
    table.increments('id').primary();
    table.integer('project_id').unsigned().notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('code').unique();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    table.unique(['project_id', 'name']);
  });

  await knex.schema.alterTable('timesheet_entries', (table) => {
    table.integer('project_id').unsigned().references('id').inTable('projects').onDelete('SET NULL');
    table.integer('task_id').unsigned().references('id').inTable('tasks').onDelete('SET NULL');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('timesheet_entries', (table) => {
    table.dropColumn('task_id');
    table.dropColumn('project_id');
  });

  await knex.schema.dropTableIfExists('tasks');
}
