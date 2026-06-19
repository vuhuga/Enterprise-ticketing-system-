const db = require('../db');

// Retrieve all ticket statuses sorted by order
const getStatuses = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM ticket_statuses ORDER BY sortOrder ASC, id ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching statuses:', error);
    res.status(500).json({ error: 'Failed to fetch statuses' });
  }
};

// Get single status by ID
const getStatusById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute(
      'SELECT * FROM ticket_statuses WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Status not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
};

// Create new ticket status with validation
const createStatus = async (req, res) => {
  try {
    const { value, label, color, sortOrder, isActive = true, isFinal = false } = req.body;

    if (!value || !label || sortOrder === undefined) {
      return res.status(400).json({ error: 'Value, label, and sortOrder are required' });
    }

    // Check for duplicate status values
    const [existing] = await db.execute(
      'SELECT id FROM ticket_statuses WHERE value = ?',
      [value]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Status value already exists' });
    }

    const [result] = await db.execute(
      'INSERT INTO ticket_statuses (value, label, color, sortOrder, isActive, isFinal) VALUES (?, ?, ?, ?, ?, ?)',
      [value, label, color, sortOrder, isActive, isFinal]
    );

    const [newStatus] = await db.execute(
      'SELECT * FROM ticket_statuses WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newStatus[0]);
  } catch (error) {
    console.error('Error creating status:', error);
    res.status(500).json({ error: 'Failed to create status' });
  }
};

// Update existing ticket status
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { value, label, color, sortOrder, isActive, isFinal } = req.body;

    // Verify status exists
    const [existing] = await db.execute(
      'SELECT * FROM ticket_statuses WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Status not found' });
    }

    // Check for duplicate values excluding current record
    if (value) {
      const [duplicate] = await db.execute(
        'SELECT id FROM ticket_statuses WHERE value = ? AND id != ?',
        [value, id]
      );

      if (duplicate.length > 0) {
        return res.status(400).json({ error: 'Status value already exists' });
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
    if (isFinal !== undefined) {
      updateFields.push('isFinal = ?');
      updateValues.push(isFinal);
    }

    updateFields.push('updatedAt = NOW()');
    updateValues.push(id);

    await db.execute(
      `UPDATE ticket_statuses SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [updated] = await db.execute(
      'SELECT * FROM ticket_statuses WHERE id = ?',
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

// Delete status with usage checks
const deleteStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify status exists
    const [existing] = await db.execute(
      'SELECT * FROM ticket_statuses WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Status not found' });
    }

    // Check for tickets using this status
    const [ticketsUsingStatus] = await db.execute(
      'SELECT COUNT(*) as count FROM tickets WHERE status = ?',
      [existing[0].value]
    );

    if (ticketsUsingStatus[0].count > 0) {
      return res.status(400).json({
        error: 'Cannot delete status that is being used by existing tickets'
      });
    }

    await db.execute('DELETE FROM ticket_statuses WHERE id = ?', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting status:', error);
    res.status(500).json({ error: 'Failed to delete status' });
  }
};

module.exports = {
  getStatuses,
  getStatusById,
  createStatus,
  updateStatus,
  deleteStatus
};