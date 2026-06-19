const db = require('../db');

// Convert database row to frontend format
const transformPriority = (row) => {
  return {
    id: row.id,
    value: row.value,
    label: row.label,
    color: row.color,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    assignmentSlaMinutes: row.assignment_sla_minutes,
    resolutionSlaMinutes: row.resolution_sla_minutes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt || row.updated_at
  };
};

// Retrieve all priorities sorted by order
const getPriorities = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM priorities ORDER BY sortOrder ASC, id ASC'
    );
    const transformedRows = rows.map(transformPriority);
    res.json(transformedRows);
  } catch (error) {
    console.error('Error fetching priorities:', error);
    res.status(500).json({ error: 'Failed to fetch priorities' });
  }
};

// Get single priority by ID
const getPriorityById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(
      'SELECT * FROM priorities WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Priority not found' });
    }

    res.json(transformPriority(rows[0]));
  } catch (error) {
    console.error('Error fetching priority:', error);
    res.status(500).json({ error: 'Failed to fetch priority' });
  }
};

// Create new priority with SLA validation
const createPriority = async (req, res) => {
  try {
    const {
      value,
      label,
      color,
      sortOrder,
      isActive = true,
      assignmentSlaMinutes = 1440, // Default: 1 day
      resolutionSlaMinutes = 10080  // Default: 1 week
    } = req.body;

    if (!value || !label || sortOrder === undefined) {
      return res.status(400).json({ error: 'Value, label, and sortOrder are required' });
    }

    // Validate SLA time ranges
    if (assignmentSlaMinutes && (assignmentSlaMinutes < 1 || assignmentSlaMinutes > 525600)) {
      return res.status(400).json({ error: 'Assignment SLA must be between 1 minute and 1 year' });
    }
    if (resolutionSlaMinutes && (resolutionSlaMinutes < 1 || resolutionSlaMinutes > 525600)) {
      return res.status(400).json({ error: 'Resolution SLA must be between 1 minute and 1 year' });
    }

    // Check for duplicate priority values
    const [existing] = await db.execute(
      'SELECT id FROM priorities WHERE value = ?',
      [value]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Priority value already exists' });
    }

    const [result] = await db.execute(
      'INSERT INTO priorities (value, label, color, sortOrder, isActive, assignment_sla_minutes, resolution_sla_minutes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [value, label, color, sortOrder, isActive, assignmentSlaMinutes, resolutionSlaMinutes]
    );

    const [newPriority] = await db.execute(
      'SELECT * FROM priorities WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(transformPriority(newPriority[0]));
  } catch (error) {
    console.error('Error creating priority:', error);
    res.status(500).json({ error: 'Failed to create priority' });
  }
};

// Update existing priority with validation
const updatePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { value, label, color, sortOrder, isActive, assignmentSlaMinutes, resolutionSlaMinutes } = req.body;

    // Verify priority exists
    const [existing] = await db.execute(
      'SELECT * FROM priorities WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Priority not found' });
    }

    // Validate SLA values if provided
    if (assignmentSlaMinutes !== undefined && (assignmentSlaMinutes < 1 || assignmentSlaMinutes > 525600)) {
      return res.status(400).json({ error: 'Assignment SLA must be between 1 minute and 1 year' });
    }
    if (resolutionSlaMinutes !== undefined && (resolutionSlaMinutes < 1 || resolutionSlaMinutes > 525600)) {
      return res.status(400).json({ error: 'Resolution SLA must be between 1 minute and 1 year' });
    }

    // Check for duplicate values excluding current record
    if (value) {
      const [duplicate] = await db.execute(
        'SELECT id FROM priorities WHERE value = ? AND id != ?',
        [value, id]
      );

      if (duplicate.length > 0) {
        return res.status(400).json({ error: 'Priority value already exists' });
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (value !== undefined) {
      updateFields.push('value = ?');
      updateValues.push(value);
    }
    if (label !== undefined) {
      updateFields.push('label = ?');
      updateValues.push(label);
    }
    if (color !== undefined) {
      updateFields.push('color = ?');
      updateValues.push(color);
    }
    if (sortOrder !== undefined) {
      updateFields.push('sortOrder = ?');
      updateValues.push(sortOrder);
    }
    if (isActive !== undefined) {
      updateFields.push('isActive = ?');
      updateValues.push(isActive);
    }
    if (assignmentSlaMinutes !== undefined) {
      updateFields.push('assignment_sla_minutes = ?');
      updateValues.push(assignmentSlaMinutes);
    }
    if (resolutionSlaMinutes !== undefined) {
      updateFields.push('resolution_sla_minutes = ?');
      updateValues.push(resolutionSlaMinutes);
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    await db.execute(
      `UPDATE priorities SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [updated] = await db.execute(
      'SELECT * FROM priorities WHERE id = ?',
      [id]
    );

    res.json(transformPriority(updated[0]));
  } catch (error) {
    console.error('Error updating priority:', error);
    res.status(500).json({ error: 'Failed to update priority' });
  }
};

// Delete priority with usage checks
const deletePriority = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify priority exists
    const [existing] = await db.execute(
      'SELECT * FROM priorities WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Priority not found' });
    }

    // Check for tickets using this priority
    const [ticketsUsingPriority] = await db.execute(
      'SELECT COUNT(*) as count FROM tickets WHERE priority = ?',
      [existing[0].value]
    );

    if (ticketsUsingPriority[0].count > 0) {
      return res.status(400).json({
        error: 'Cannot delete priority that is being used by existing tickets'
      });
    }

    await db.execute('DELETE FROM priorities WHERE id = ?', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting priority:', error);
    res.status(500).json({ error: 'Failed to delete priority' });
  }
};

module.exports = {
  getPriorities,
  getPriorityById,
  createPriority,
  updatePriority,
  deletePriority
};