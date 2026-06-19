const db = require('../db');

// Retrieve all system settings organized by category
const getSettings = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM system_settings ORDER BY category, `key`'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
};

// Get settings filtered by category
const getSettingsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const [rows] = await db.execute(
      'SELECT * FROM system_settings WHERE category = ? ORDER BY `key`',
      [category]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching settings by category:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// Get single setting by key
const getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const [rows] = await db.execute(
      'SELECT * FROM system_settings WHERE `key` = ?',
      [key]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
};

// Get file upload configuration settings
const getFileUploadConfig = async (req, res) => {
  try {
    const [settings] = await db.execute(
      'SELECT * FROM system_settings WHERE category = "file_upload"'
    );

    const config = {
      maxFileSize: 5, // Default 5MB
      allowedFileTypes: ['image/png', 'image/jpeg', 'application/pdf'], // Default types
      maxFilesPerTicket: 3 // Default 3 files
    };

    settings.forEach(setting => {
      switch (setting.key) {
        case 'max_file_size_mb':
          config.maxFileSize = parseInt(setting.value);
          break;
        case 'allowed_file_types':
          config.allowedFileTypes = JSON.parse(setting.value);
          break;
        case 'max_files_per_ticket':
          config.maxFilesPerTicket = parseInt(setting.value);
          break;
      }
    });

    res.json(config);
  } catch (error) {
    console.error('Error fetching file upload config:', error);
    res.status(500).json({ error: 'Failed to fetch file upload configuration' });
  }
};

// Create new system setting
const createSetting = async (req, res) => {
  try {
    const { key, value, label, description, dataType, category, isEditable = true, isActive = true } = req.body;

    if (!key || !value || !label || !dataType || !category) {
      return res.status(400).json({ error: 'Key, value, label, dataType, and category are required' });
    }

    // Check for duplicate setting keys
    const [existing] = await db.execute(
      'SELECT id FROM system_settings WHERE `key` = ?',
      [key]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Setting key already exists' });
    }

    const [result] = await db.execute(
      'INSERT INTO system_settings (`key`, value, label, description, dataType, category, isEditable, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [key, value, label, description, dataType, category, isEditable, isActive]
    );

    const [newSetting] = await db.execute(
      'SELECT * FROM system_settings WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newSetting[0]);
  } catch (error) {
    console.error('Error creating setting:', error);
    res.status(500).json({ error: 'Failed to create setting' });
  }
};

// Update existing system setting
const updateSetting = async (req, res) => {
  try {
    const { id } = req.params;
    const { value, label, description, isEditable, isActive } = req.body;

    // Verify setting exists
    const [existing] = await db.execute(
      'SELECT * FROM system_settings WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    // Check edit permissions
    if (!existing[0].isEditable) {
      return res.status(403).json({ error: 'This setting cannot be modified' });
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
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (isEditable !== undefined) {
      updateFields.push('isEditable = ?');
      updateValues.push(isEditable);
    }
    if (isActive !== undefined) {
      updateFields.push('isActive = ?');
      updateValues.push(isActive);
    }

    updateFields.push('updatedAt = NOW()');
    updateValues.push(id);

    await db.execute(
      `UPDATE system_settings SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const [updated] = await db.execute(
      'SELECT * FROM system_settings WHERE id = ?',
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
};

// Delete system setting with permission checks
const deleteSetting = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify setting exists
    const [existing] = await db.execute(
      'SELECT * FROM system_settings WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    // Check delete permissions
    if (!existing[0].isEditable) {
      return res.status(403).json({ error: 'This setting cannot be deleted' });
    }

    await db.execute('DELETE FROM system_settings WHERE id = ?', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
};

module.exports = {
  getSettings,
  getSettingsByCategory,
  getSettingByKey,
  getFileUploadConfig,
  createSetting,
  updateSetting,
  deleteSetting
};