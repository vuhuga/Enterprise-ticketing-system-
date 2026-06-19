const db = require('../db');

// Retrieve all roles with parsed permissions
const getRoles = async (req, res) => {
  try {
    console.log('🔍 Fetching roles from database...');
    const [roles] = await db.execute(`
      SELECT id, name, slug, permissions, created_at as createdAt, updated_at as updatedAt
      FROM roles
      ORDER BY created_at DESC
    `);

    console.log('🔍 Raw roles from database:', roles);

    // Parse JSON permissions for each role
    const rolesWithPermissions = roles.map(role => {
      let parsedPermissions = [];
      try {
        if (role.permissions) {
          parsedPermissions = JSON.parse(role.permissions);
        }
      } catch (parseError) {
        console.error('Error parsing permissions for role', role.id, ':', parseError);
        parsedPermissions = [];
      }

      return {
        ...role,
        permissions: parsedPermissions
      };
    });

    console.log('✅ Processed roles:', rolesWithPermissions);
    res.json(rolesWithPermissions);
  } catch (error) {
    console.error('❌ Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

// Create new role with permissions
const createRole = async (req, res) => {
  try {
    console.log('🔍 Role creation request received:', req.body);
    const { name, slug, permissions = [] } = req.body;

    if (!name || !slug) {
      console.log('❌ Missing required fields - name:', name, 'slug:', slug);
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    // Check for duplicate role names or slugs
    const [existing] = await db.execute('SELECT id FROM roles WHERE name = ? OR slug = ?', [name, slug]);
    if (existing.length > 0) {
      console.log('❌ Role already exists with name or slug:', name, slug);
      return res.status(400).json({ error: 'Role with this name or slug already exists' });
    }

    console.log('🔍 Creating role with data:', { name, slug, permissions });

    const [result] = await db.execute(`
      INSERT INTO roles (name, slug, permissions)
      VALUES (?, ?, ?)
    `, [name, slug, JSON.stringify(permissions)]);

    console.log('🔍 Role created with ID:', result.insertId);

    const [newRole] = await db.execute(`
      SELECT id, name, slug, permissions, created_at as createdAt, updated_at as updatedAt
      FROM roles WHERE id = ?
    `, [result.insertId]);

    const roleWithPermissions = {
      ...newRole[0],
      permissions: newRole[0].permissions ? JSON.parse(newRole[0].permissions) : []
    };

    console.log('✅ Role creation successful:', roleWithPermissions);
    res.status(201).json(roleWithPermissions);
  } catch (error) {
    console.error('❌ Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
};

// Update existing role
const updateRole = async (req, res) => {
  try {
    console.log('🔍 Role update request received for ID:', req.params.id);
    console.log('🔍 Update data:', req.body);

    const { id } = req.params;
    const { name, slug, permissions } = req.body;

    if (!name || !slug) {
      console.log('❌ Missing required fields for update - name:', name, 'slug:', slug);
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const [existing] = await db.execute('SELECT id FROM roles WHERE id = ?', [id]);
    if (existing.length === 0) {
      console.log('❌ Role not found with ID:', id);
      return res.status(404).json({ error: 'Role not found' });
    }

    console.log('🔍 Updating role with data:', { name, slug, permissions });

    await db.execute(`
      UPDATE roles SET name = ?, slug = ?, permissions = ?, updated_at = NOW()
      WHERE id = ?
    `, [name, slug, JSON.stringify(permissions || []), id]);

    console.log('🔍 Role updated, fetching updated data...');

    const [updatedRole] = await db.execute(`
      SELECT id, name, slug, permissions, created_at as createdAt, updated_at as updatedAt
      FROM roles WHERE id = ?
    `, [id]);

    let roleWithPermissions = {
      ...updatedRole[0],
      permissions: []
    };

    try {
      if (updatedRole[0].permissions) {
        roleWithPermissions.permissions = JSON.parse(updatedRole[0].permissions);
      }
    } catch (parseError) {
      console.error('Error parsing permissions for updated role:', parseError);
      roleWithPermissions.permissions = [];
    }

    console.log('✅ Role update successful:', roleWithPermissions);
    res.json(roleWithPermissions);
  } catch (error) {
    console.error('❌ Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
};

// Delete role with user assignment checks
const deleteRole = async (req, res) => {
  try {
    console.log('🔍 Role delete request received for ID:', req.params.id);
    const { id } = req.params;

    // Verify role exists
    console.log('🔍 Checking if role exists...');
    const [existing] = await db.execute('SELECT id, name, slug FROM roles WHERE id = ?', [id]);
    if (existing.length === 0) {
      console.log('❌ Role not found with ID:', id);
      return res.status(404).json({ error: 'Role not found' });
    }

    const roleToDelete = existing[0];
    console.log('🔍 Role found:', roleToDelete);

    console.log('🔍 Role exists, checking if assigned to users...');
    // Check if role is being used by any users
    // Note: users table has 'role' column with role slug/name, not role_id
    const [usersWithRole] = await db.execute('SELECT id FROM users WHERE role = ?', [roleToDelete.slug]);
    console.log('🔍 Checked for users with role slug:', roleToDelete.slug);
    console.log('🔍 Found', usersWithRole.length, 'users with this role');
    if (usersWithRole.length > 0) {
      console.log('❌ Cannot delete role - assigned to', usersWithRole.length, 'users');
      return res.status(400).json({ error: 'Cannot delete role that is assigned to users' });
    }

    console.log('🔍 Role is safe to delete, proceeding...');
    await db.execute('DELETE FROM roles WHERE id = ?', [id]);

    console.log('✅ Role deleted successfully');
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
};

module.exports = {
  getRoles,
  createRole,
  updateRole,
  deleteRole
};