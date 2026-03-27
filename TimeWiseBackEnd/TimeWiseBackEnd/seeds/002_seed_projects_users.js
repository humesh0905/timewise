export async function seed(knex) {
  // 1️⃣ Seed projects
  await knex('tasks').del();
  await knex('projects').del();
  await knex('projects').insert([
    { name: 'Project 1', code: 'PA', is_active: true },
    { name: 'Project 2', code: 'PB', is_active: true },
    { name: 'Project 3', code: 'IT', is_active: true }
  ]);

  // 1.1️⃣ Seed tasks by project
  const projects = await knex('projects').select('id', 'code');
  const byCode = Object.fromEntries(projects.map((p) => [p.code, p.id]));
  const taskRows = [
    { projectCode: 'PA', name: 'Frontend', code: 'TASK-FE' },
    { projectCode: 'PB', name: 'Backend', code: 'TASK-BE' },
    { projectCode: 'IT', name: 'DB', code: 'TASK-DB' },
  ]
    .filter((t) => byCode[t.projectCode])
    .map((t) => ({
      project_id: byCode[t.projectCode],
      name: t.name,
      code: t.code,
      is_active: true,
    }));

  if (taskRows.length) {
    await knex('tasks').insert(taskRows);
  }

  // 2️⃣ Seed sample users (keep existing if they exist)
  const existingUsers = await knex('users').select('id', 'email');
  
  // Only insert if users don't exist
  if (existingUsers.length === 0) {
    await knex('users').insert([
      {
        email: 'admin@timewise.local',
        first_name: 'Admin',
        last_name: 'User',
        timezone: 'UTC'
      },
      {
        email: 'employee@timewise.local',
        first_name: 'Employee',
        last_name: 'User',
        timezone: 'UTC'
      }
    ]);
  }

  // 3️⃣ Assign Admin role to admin@timewise.local and humesh144@gmail.com
  const adminRole = await knex('roles').where({ name: 'Admin' }).first();
  const managerRole = await knex('roles').where({ name: 'Manager' }).first();

  if (adminRole) {
    // Assign Admin to admin@timewise.local
    const adminUser = await knex('users').where({ email: 'admin@timewise.local' }).first();
    if (adminUser) {
      const exists = await knex('user_roles')
        .where({ user_id: adminUser.id, role_id: adminRole.id })
        .first();
      if (!exists) {
        await knex('user_roles').insert({ user_id: adminUser.id, role_id: adminRole.id });
      }
    }

    // Assign Manager to humesh144@gmail.com (or Admin if you prefer)
    const googleUser = await knex('users').where({ email: 'humesh144@gmail.com' }).first();
    if (googleUser) {
      const exists = await knex('user_roles')
        .where({ user_id: googleUser.id, role_id: adminRole.id })
        .first();
      if (!exists) {
        await knex('user_roles').insert({ user_id: googleUser.id, role_id: adminRole.id });
      }
    }
  }

  if (managerRole) {
    // Assign Manager to employee@timewise.local
    const empUser = await knex('users').where({ email: 'employee@timewise.local' }).first();
    if (empUser) {
      const exists = await knex('user_roles')
        .where({ user_id: empUser.id, role_id: managerRole.id })
        .first();
      if (!exists) {
        await knex('user_roles').insert({ user_id: empUser.id, role_id: managerRole.id });
      }
    }
  }

  console.log('✅ Projects, tasks, users, and roles seeded successfully.');
}
