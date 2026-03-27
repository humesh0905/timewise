export async function up(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.text('google_id');
    t.text('password_hash');
    t.jsonb('working_hours').defaultTo('{}');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('google_id');
    t.dropColumn('password_hash');
    t.dropColumn('working_hours');
  });
}
