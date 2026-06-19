const db = require('../db');

// Retrieve all ticket types with status conversion
const getTicketTypes = async (req, res) => {
  try {
    const [ticketTypes] = await db.execute(`
      SELECT id, name, description, category, priority_level as priorityLevel,
             status, created_at as createdAt, updated_at as updatedAt
      FROM ticket_types
      ORDER BY created_at DESC
    `);

    // Convert MySQL boolean to JavaScript boolean
    const processedTicketTypes = ticketTypes.map(type => ({
      ...type,
      isActive: type.status === 'active'
    }));

    console.log('🔍 Ticket Types API called - Returning:', processedTicketTypes.length, 'ticket types');
    console.log('🔍 Ticket Types Data:', JSON.stringify(processedTicketTypes, null, 2));

    res.json(processedTicketTypes);
  } catch (error) {
    console.error('Error fetching ticket types:', error);
    res.status(500).json({ error: 'Failed to fetch ticket types' });
  }
};

// Create new ticket type with validation
const createTicketType = async (req, res) => {
  try {
    const { name, description, category, priorityLevel, isActive = true } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Check if ticket type already exists
    const [existing] = await db.execute('SELECT id FROM ticket_types WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Ticket type with this name already exists' });
    }

    // Convert isActive boolean to status string
    const status = isActive ? 'active' : 'inactive';

    const [result] = await db.execute(`
      INSERT INTO ticket_types (name, description, category, priority_level, status)
      VALUES (?, ?, ?, ?, ?)
    `, [name, description || null, category || null, priorityLevel || 'medium', status]);

    const [newTicketType] = await db.execute(`
      SELECT id, name, description, category, priority_level as priorityLevel,
             status, created_at as createdAt, updated_at as updatedAt
      FROM ticket_types WHERE id = ?
    `, [result.insertId]);

    // Convert MySQL status to JavaScript boolean
    const processedTicketType = {
      ...newTicketType[0],
      isActive: newTicketType[0].status === 'active'
    };

    res.status(201).json(processedTicketType);
  } catch (error) {
    console.error('Error creating ticket type:', error);
    res.status(500).json({ error: 'Failed to create ticket type' });
  }
};

// Update existing ticket type
const updateTicketType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, priorityLevel, isActive } = req.body;

    const [existing] = await db.execute('SELECT id FROM ticket_types WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Ticket type not found' });
    }

    // Convert isActive boolean to status string
    const status = isActive ? 'active' : 'inactive';

    await db.execute(`
      UPDATE ticket_types SET name = ?, description = ?, category = ?, priority_level = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `, [name, description, category, priorityLevel, status, id]);

    const [updatedTicketType] = await db.execute(`
      SELECT id, name, description, category, priority_level as priorityLevel,
             status, (status = 'active') as isActive, created_at as createdAt, updated_at as updatedAt
      FROM ticket_types WHERE id = ?
    `, [id]);

    res.json(updatedTicketType[0]);
  } catch (error) {
    console.error('Error updating ticket type:', error);
    res.status(500).json({ error: 'Failed to update ticket type' });
  }
};

// Delete ticket type with usage validation
const deleteTicketType = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ticket type exists
    const [existing] = await db.execute('SELECT id FROM ticket_types WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Ticket type not found' });
    }

    // Check if ticket type is being used by any tickets
    const [ticketsWithType] = await db.execute('SELECT id FROM tickets WHERE type = (SELECT name FROM ticket_types WHERE id = ?)', [id]);
    if (ticketsWithType.length > 0) {
      return res.status(400).json({ error: 'Cannot delete ticket type that has associated tickets' });
    }

    await db.execute('DELETE FROM ticket_types WHERE id = ?', [id]);
    res.json({ message: 'Ticket type deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket type:', error);
    res.status(500).json({ error: 'Failed to delete ticket type' });
  }
};

module.exports = {
  getTicketTypes,
  createTicketType,
  updateTicketType,
  deleteTicketType
};