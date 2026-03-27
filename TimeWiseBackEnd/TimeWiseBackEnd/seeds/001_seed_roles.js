export async function seed(knex) {
  await knex('roles').del();
  await knex('roles').insert([
    { name: 'Admin', description: 'Full system access' },
    { name: 'HR', description: 'Manages employees and payroll' },
    { name: 'Manager', description: 'Approves timesheets and manages teams' },
    { name: 'Employee', description: 'Regular user filling timesheets' },
    { name: 'Custom', description: 'Custom role for configurable permissions' }
  ]);
  console.log('✅ Roles seeded successfully.');
}
