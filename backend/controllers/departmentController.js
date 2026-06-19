const db = require('../db');

// Retrieve all departments with full details
const getDepartments = async (req, res) => {
  try {
    const [departments] = await db.execute(`
      SELECT id, name, description, manager_id as managerId,
             status, created_at as createdAt, updated_at as updatedAt
      FROM departments
      ORDER BY created_at DESC
    `);

    // Convert database status to boolean for frontend
    const processedDepartments = departments.map(dept => ({
      ...dept,
      isActive: dept.status === 'active'
    }));

    res.json(processedDepartments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

// Create new department with validation
const createDepartment = async (req, res) => {
  try {
    const { name, description, managerId, isActive = true } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Check for duplicate department names
    const [existing] = await db.execute('SELECT id FROM departments WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Department with this name already exists' });
    }

    // Convert boolean to database status
    const status = isActive ? 'active' : 'inactive';

    const [result] = await db.execute(`
      INSERT INTO departments (name, description, manager_id, status)
      VALUES (?, ?, ?, ?)
    `, [name, description || null, managerId || null, status]);

    const [newDepartment] = await db.execute(`
      SELECT id, name, description, manager_id as managerId,
             status, (status = 'active') as isActive, created_at as createdAt, updated_at as updatedAt
      FROM departments WHERE id = ?
    `, [result.insertId]);

    res.status(201).json(newDepartment[0]);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
};

// Update existing department
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, managerId, isActive } = req.body;

    const [existing] = await db.execute('SELECT id FROM departments WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Convert boolean to database status
    const status = isActive ? 'active' : 'inactive';

    await db.execute(`
      UPDATE departments SET name = ?, description = ?, manager_id = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `, [name, description, managerId, status, id]);

    const [updatedDepartment] = await db.execute(`
      SELECT id, name, description, manager_id as managerId,
             status, (status = 'active') as isActive, created_at as createdAt, updated_at as updatedAt
      FROM departments WHERE id = ?
    `, [id]);

    res.json(updatedDepartment[0]);
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
};

// Delete department with dependency checks
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify department exists
    const [existing] = await db.execute('SELECT id FROM departments WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Check for tickets using this department
    const [ticketsWithDepartment] = await db.execute('SELECT id FROM tickets WHERE department = (SELECT name FROM departments WHERE id = ?)', [id]);
    if (ticketsWithDepartment.length > 0) {
      return res.status(400).json({ error: 'Cannot delete department that has associated tickets' });
    }

    await db.execute('DELETE FROM departments WHERE id = ?', [id]);
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
};

// Get active departments for dropdowns
const getAllDepartments = async (req, res) => {
  try {
    const [departments] = await db.execute(`
      SELECT id, name, status,
             (status = 'active') as isActive
      FROM departments
      WHERE status = 'active'
      ORDER BY name ASC
    `);

    // Ensure boolean type for frontend
    const processedDepartments = departments.map(dept => ({
      ...dept,
      isActive: Boolean(dept.isActive)
    }));

    res.json(processedDepartments);
  } catch (error) {
    console.error('Error fetching all departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

module.exports = {
  getDepartments,
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};