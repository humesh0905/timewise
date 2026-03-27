export async function up(knex) {
  const exists = await knex.schema.hasTable('timesheets');
  if (!exists) {
    await knex.schema.createTable('timesheets', (table) => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.date('work_date').notNullable();
      table.string('project_name', 255).notNullable();
      table.decimal('hours', 5, 2).defaultTo(0);
      table.text('task_description');
      table.timestamps(true, true);
    });
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('timesheets');
}
