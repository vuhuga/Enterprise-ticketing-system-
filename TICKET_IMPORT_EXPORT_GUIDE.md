# Ticket Import/Export Guide

## Overview
The ticket management system includes powerful import and export functionality that allows you to:
- **Export** existing tickets to CSV format for backup or analysis
- **Import** tickets in bulk from CSV or JSON files
- **Download** a template file to understand the required format

## Features

### 1. Export Tickets
Export your tickets in multiple formats: Excel, PDF, or CSV.

**How to use:**
1. Navigate to the Tickets page
2. (Optional) Apply filters to export only specific tickets
3. Select your preferred format from the dropdown:
   - **Excel** (.xlsx) - Best for data analysis and editing
   - **PDF** (.pdf) - Best for printing and sharing reports
   - **CSV** (.csv) - Best for importing into other systems
4. Click the **📤 Export** button
5. The file will be downloaded with timestamp in the filename

**Export Formats:**

**Excel (.xlsx)**
- Properly formatted spreadsheet with column headers
- Optimized column widths for readability
- Can be opened in Microsoft Excel, Google Sheets, LibreOffice
- Best for: Data analysis, editing, and sharing

**PDF (.pdf)**
- Professional tabular report format
- Includes export date and ticket count
- Landscape orientation for better viewing
- Color-coded headers
- Best for: Printing, presentations, and archiving

**CSV (.csv)**
- Plain text comma-separated values
- Universal compatibility
- Best for: Importing into other systems

**Exported Fields:**
- Ticket Key
- Subject
- Type
- Department
- Priority
- Status
- Customer Name
- Customer Email
- Assigned To
- Created Date
- Updated Date

### 2. Import Tickets
Import multiple tickets at once from a CSV or JSON file.

**How to use:**
1. Click the **📋 Template** button to download a sample CSV file
2. Fill in your ticket data following the template format
3. Click the **📥 Import** button
4. Select your CSV or JSON file
5. The system will validate and import your tickets

**Required Fields:**
- `subject` - Ticket title (required)
- `description` - Detailed description (required)
- `customerEmail` - Customer's email address (required)

**Optional Fields:**
- `type` - Ticket type (default: "General")
- `department` - Department name (default: "Support")
- `priority` - Priority level: low, medium, high, urgent (default: "medium")
- `status` - Status: new, open, in_progress, resolved, closed (default: "new")
- `customerName` - Customer's full name
- `assignedToName` - Name of assigned staff member (leave empty for automatic assignment)
- `resolution_comment` - Resolution notes (for resolved tickets)

### Automatic Assignment

**You don't need to fill the `assignedToName` column!** The system will automatically assign tickets to available staff members based on:

1. **Department**: Assigns to staff in the ticket's department
2. **Workload**: Chooses the staff member with the fewest open tickets
3. **Availability**: Only assigns to active staff members

**Manual Assignment (Optional):**
If you want to assign to a specific person, enter their full name in the `assignedToName` column. The system will:
- Search for a matching staff member
- Fall back to automatic assignment if the name isn't found

### 3. Download Template
Get a pre-formatted CSV template with sample data.

**How to use:**
1. Click the **📋 Template** button
2. A file named `ticket-import-template.csv` will be downloaded
3. Open it in Excel, Google Sheets, or any spreadsheet application
4. Replace the sample data with your actual ticket information
5. Save and import the file

## CSV Format Example

```csv
subject,description,type,department,priority,status,customerName,customerEmail,assignedToName,resolution_comment
Login Issue,User cannot login to the system,Technical,IT,high,open,John Doe,john.doe@example.com,Admin User,
Billing Question,Question about invoice charges,Billing,Finance,medium,new,Jane Smith,jane.smith@example.com,,
Password Reset,Need to reset account password,General,Support,low,resolved,Bob Johnson,bob.johnson@example.com,Support Team,Password reset link sent successfully
```

## JSON Format Example

```json
[
  {
    "subject": "Login Issue",
    "description": "User cannot login to the system",
    "type": "Technical",
    "department": "IT",
    "priority": "high",
    "status": "open",
    "customerName": "John Doe",
    "customerEmail": "john.doe@example.com",
    "assignedToName": "Admin User"
  },
  {
    "subject": "Billing Question",
    "description": "Question about invoice charges",
    "type": "Billing",
    "department": "Finance",
    "priority": "medium",
    "status": "new",
    "customerName": "Jane Smith",
    "customerEmail": "jane.smith@example.com"
  }
]
```

## Validation Rules

The import process validates all data before creating tickets:

1. **Email Validation**: Customer email must be in valid format
2. **Required Fields**: Subject, description, and customerEmail must not be empty
3. **Status Values**: Must be one of: new, open, in_progress, resolved, closed
4. **Priority Values**: Must be one of: low, medium, high, urgent
5. **Date Format**: If provided, dates must be in ISO format (YYYY-MM-DD)

## Import Process

When you import tickets:

1. **File Parsing**: The system reads your CSV or JSON file
2. **Validation**: Each row is validated against the rules above
3. **User Creation**: If a customer email doesn't exist, a new user account is created automatically
4. **Ticket Creation**: Valid tickets are created in the database
5. **Results**: You'll see a summary showing:
   - Number of tickets successfully imported
   - Number of failed imports
   - Specific error messages for failed rows

## Error Handling

If import fails, you'll receive detailed error messages:

- **Row Number**: Which row in your file has the error
- **Field Name**: Which field caused the error
- **Error Message**: What went wrong
- **Data**: The problematic data for reference

Example error message:
```
Row 5: customerEmail - Invalid email format
```


## Tips for Successful Import

1. **Use the Template**: Always start with the downloaded template
2. **Check Email Addresses**: Ensure all emails are valid
3. **Consistent Values**: Use consistent values for status, priority, etc.
4. **Test Small Batches**: Import a few tickets first to test your format
5. **Backup First**: Export existing tickets before importing new ones
6. **Remove Headers**: If copying from another system, ensure only one header row exists

## Troubleshooting

**Import button doesn't work:**
- Check that you've selected a valid CSV or JSON file
- Ensure the file is not empty

**All imports fail:**
- Verify your file has the correct headers
- Check that required fields (subject, description, customerEmail) are filled
- Ensure there are no special characters causing parsing issues

**Some tickets import, others fail:**
- Review the error messages for specific issues
- Check the failed rows in your original file
- Fix the errors and re-import only the failed rows

**Customer accounts not created:**
- Verify email addresses are in correct format
- Check that emails don't contain spaces or special characters

## Best Practices

1. **Regular Exports**: Export tickets regularly for backup purposes
2. **Data Cleanup**: Clean your data before importing (remove duplicates, fix formatting)
3. **Incremental Imports**: Import in smaller batches rather than thousands at once
4. **Verify After Import**: Check a few imported tickets to ensure data accuracy
5. **Keep Templates**: Save your import templates for future use

## Support

If you encounter issues with import/export:
1. Check this guide for common solutions
2. Verify your file format matches the template
3. Review error messages carefully
4. Contact system administrator if problems persist

---

**Last Updated**: January 2025
**Version**: 1.0
