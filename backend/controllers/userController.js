const db = require('../db');

// Retrieve users with pagination, search, and role information
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [];

    if (search) {
      whereClause = 'WHERE u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.role LIKE ?';
      queryParams = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
    }

    // Return simplified user list for settings page
    if (req.query.simple === 'true') {
      const [users] = await db.execute(`
        SELECT
          u.id,
          u.first_name as firstName,
          u.last_name as lastName,
          u.email,
          u.role,
          r.id as roleId,
          CASE WHEN u.role = 'admin' THEN 1 ELSE 0 END as isActive,
          u.created_at as createdAt,
          u.updated_at as updatedAt
        FROM users u
        LEFT JOIN roles r ON u.role = r.slug
        ORDER BY u.created_at DESC
      `);
      return res.json(users);
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM users u ${whereClause}`;
    const [countResult] = await db.execute(countQuery, queryParams);
    const total = countResult[0].total;

    // Fetch paginated user data with department info
    const usersQuery = `
      SELECT
        u.id,
        u.first_name as firstName,
        u.last_name as lastName,
        u.email,
        u.role,
        u.department_id as departmentId,
        d.name as departmentName,
        u.phone,
        u.city,
        u.country,
        u.address,
        u.photo,
        u.is_active as isActive,
        u.created_at as createdAt,
        u.updated_at as updatedAt
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;

    const [users] = await db.execute(usersQuery, queryParams);

    res.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Assign role to existing user
const assignRole = async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return res.status(400).json({ error: 'User ID and Role ID are required' });
    }

    // Get role details from database
    const [role] = await db.execute('SELECT slug, name FROM roles WHERE id = ?', [roleId]);
    if (role.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Update user's role
    await db.execute(`
      UPDATE users SET role = ?, updated_at = NOW()
      WHERE id = ?
    `, [role[0].slug, userId]);

    // Return updated user data
    const [updatedUser] = await db.execute(`
      SELECT
        u.id,
        u.first_name as firstName,
        u.last_name as lastName,
        u.email,
        u.role,
        r.id as roleId,
        CASE WHEN u.role = 'admin' THEN 1 ELSE 0 END as isActive,
        u.created_at as createdAt,
        u.updated_at as updatedAt
      FROM users u
      LEFT JOIN roles r ON u.role = r.slug
      WHERE u.id = ?
    `, [userId]);

    if (updatedUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser[0]);
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({ error: 'Failed to assign role' });
  }
};

// Update user profile information
const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, email, role, departmentId, status } = req.body;

    console.log('🔄 Update User Request:', {
      userId,
      firstName,
      lastName,
      email,
      role,
      departmentId,
      status
    });

    // Validate required fields
    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and role are required'
      });
    }

    // Determine department assignment based on role
    let finalDepartmentId = null;

    if (role === 'staff' && departmentId) {
      finalDepartmentId = departmentId;
    } else if (role === 'admin') {
      // Try to get admin department, but don't fail if not found
      try {
        const [adminDept] = await db.execute('SELECT id FROM departments WHERE name = ?', ['Admin']);
        if (adminDept.length > 0) {
          finalDepartmentId = adminDept[0].id;
          console.log('🏢 Found Admin department:', finalDepartmentId);
        }
      } catch (deptError) {
        console.log('⚠️ Could not find Admin department, proceeding with null');
      }
    }
    // For 'customer' role, department stays null

    console.log('🔄 Final values:', {
      finalDepartmentId,
      status,
      userId
    });

    // Update user record in database
    try {
      const updateResult = await db.execute(`
        UPDATE users
        SET first_name = ?, last_name = ?, email = ?, role = ?, department_id = ?, updated_at = NOW()
        WHERE id = ?
      `, [firstName, lastName, email, role, finalDepartmentId, userId]);

      console.log('🔄 Update result:', updateResult[0]);

      // Check if user was actually updated
      if (updateResult[0].affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found or no changes made'
        });
      }

      // Get updated user with simple query
      const [updatedUser] = await db.execute(`
        SELECT
          u.id,
          u.first_name as firstName,
          u.last_name as lastName,
          u.email,
          u.role,
          u.department_id as departmentId,
          'active' as status,
          u.created_at as createdAt,
          u.updated_at as updatedAt
        FROM users u
        WHERE u.id = ?
      `, [userId]);

      if (updatedUser.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found after update' });
      }

      console.log('✅ User updated successfully:', updatedUser[0]);

      res.json({
        success: true,
        message: 'User updated successfully',
        user: updatedUser[0]
      });

    } catch (updateError) {
      console.error('❌ Error updating user in database:', updateError);
      res.status(500).json({
        success: false,
        message: 'Database update failed: ' + updateError.message
      });
    }

  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

module.exports = {
  getUsers,
  assignRole,
  updateUser
};