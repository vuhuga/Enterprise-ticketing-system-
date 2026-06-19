import { Injectable } from '@angular/core';
import { Ticket } from '../../../models/ticket.model';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportOptions {
  format: 'csv' | 'excel' | 'json';
  includeFields: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: {
    status?: string[];
    priority?: string[];
    department?: string[];
    type?: string[];
  };
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: ImportError[];
  warnings: string[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  data: any;
}

export interface ImportOptions {
  skipDuplicates: boolean;
  updateExisting: boolean;
  validateData: boolean;
  defaultValues?: Partial<Ticket>;
}

@Injectable({
  providedIn: 'root'
})
export class TicketImportExportService {

  /**
   * Export tickets to CSV format
   */
  exportToCSV(tickets: Ticket[], options: ExportOptions): string {
    const headers = this.getExportHeaders(options.includeFields);
    const csvContent = [
      headers.join(','),
      ...tickets.map(ticket => this.ticketToCSVRow(ticket, options.includeFields))
    ].join('\n');

    return csvContent;
  }

  /**
   * Export tickets to Excel format (proper XLSX)
   */
  exportToExcel(tickets: Ticket[], options: ExportOptions): void {
    // Prepare data with proper headers
    const headers = this.getExportHeaders(options.includeFields);
    const data = tickets.map(ticket => 
      options.includeFields.map(field => this.getTicketFieldValue(ticket, field))
    );

    // Create worksheet with headers and data
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Set column widths for better readability
    const columnWidths = options.includeFields.map(field => {
      switch(field) {
        case 'key': return { wch: 12 };
        case 'subject': return { wch: 40 };
        case 'description': return { wch: 50 };
        case 'type': return { wch: 15 };
        case 'department': return { wch: 15 };
        case 'priority': return { wch: 10 };
        case 'status': return { wch: 12 };
        case 'customerName': return { wch: 20 };
        case 'customerEmail': return { wch: 25 };
        case 'assignedToName': return { wch: 20 };
        case 'createdAt': return { wch: 20 };
        case 'updatedAt': return { wch: 20 };
        case 'resolvedAt': return { wch: 20 };
        case 'resolution_comment': return { wch: 40 };
        default: return { wch: 15 };
      }
    });
    ws['!cols'] = columnWidths;

    // Create workbook and add worksheet
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tickets');

    // Generate Excel file and download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    XLSX.writeFile(wb, `tickets-export-${timestamp}.xlsx`);
  }

  /**
   * Export tickets to PDF format (tabular)
   */
  exportToPDF(tickets: Ticket[], options: ExportOptions): void {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation for more columns
    
    // Add logo and header
    const logoImg = new Image();
    logoImg.src = '/logo.png';
    
    // Wait for logo to load, then generate PDF
    logoImg.onload = () => {
      this.generatePDFWithLogo(doc, logoImg, tickets, options);
    };
    
    // Fallback: if logo doesn't load in 500ms, generate without it
    logoImg.onerror = () => {
      this.generatePDFWithoutLogo(doc, tickets, options);
    };
    
    setTimeout(() => {
      if (!logoImg.complete) {
        this.generatePDFWithoutLogo(doc, tickets, options);
      }
    }, 500);
  }

  private generatePDFWithLogo(doc: jsPDF, logoImg: HTMLImageElement, tickets: Ticket[], options: ExportOptions): void {
    // Add logo (centered at top) - increased size for better visibility
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoWidth = 60; // Increased from 40 to 60
    const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
    const logoX = (pageWidth - logoWidth) / 2;
    
    try {
      doc.addImage(logoImg, 'PNG', logoX, 10, logoWidth, logoHeight);
    } catch (e) {
      console.warn('Could not add logo to PDF:', e);
    }
    
    // Add system name below logo
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(102, 126, 234); // Purple color
    const systemName = "President's Award Ticketing System";
    const textWidth = doc.getTextWidth(systemName);
    doc.text(systemName, (pageWidth - textWidth) / 2, 10 + logoHeight + 8);
    
    // Add report title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const reportTitle = 'Tickets Export Report';
    const titleWidth = doc.getTextWidth(reportTitle);
    doc.text(reportTitle, (pageWidth - titleWidth) / 2, 10 + logoHeight + 16);
    
    // Add export info (right-aligned)
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const startY = 10 + logoHeight + 22;
    const generatedText = `Generated: ${new Date().toLocaleString()}`;
    const totalText = `Total Tickets: ${tickets.length}`;
    doc.text(generatedText, pageWidth - 14, startY, { align: 'right' });
    doc.text(totalText, pageWidth - 14, startY + 5, { align: 'right' });
    
    // Prepare table data
    const headers = this.getExportHeaders(options.includeFields);
    const data = tickets.map(ticket => 
      options.includeFields.map(field => {
        const value = this.getTicketFieldValue(ticket, field);
        if (typeof value === 'string' && value.length > 50) {
          return value.substring(0, 47) + '...';
        }
        return value || '';
      })
    );

    // Generate table
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: startY + 10,
      styles: { 
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 50 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
      },
      didDrawPage: (data) => {
        // Add page numbers at the bottom
        const pageCount = doc.getNumberOfPages();
        const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const pageText = `Page ${currentPage} of ${pageCount}`;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.text(pageText, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    });

    // Save PDF
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    doc.save(`tickets-export-${timestamp}.pdf`);
  }

  private generatePDFWithoutLogo(doc: jsPDF, tickets: Ticket[], options: ExportOptions): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add system name at top
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(102, 126, 234);
    const systemName = "President's Award Ticketing System";
    const textWidth = doc.getTextWidth(systemName);
    doc.text(systemName, (pageWidth - textWidth) / 2, 15);
    
    // Add report title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const reportTitle = 'Tickets Export Report';
    const titleWidth = doc.getTextWidth(reportTitle);
    doc.text(reportTitle, (pageWidth - titleWidth) / 2, 23);
    
    // Add export info (right-aligned)
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const generatedText = `Generated: ${new Date().toLocaleString()}`;
    const totalText = `Total Tickets: ${tickets.length}`;
    doc.text(generatedText, pageWidth - 14, 30, { align: 'right' });
    doc.text(totalText, pageWidth - 14, 35, { align: 'right' });
    
    // Prepare table data
    const headers = this.getExportHeaders(options.includeFields);
    const data = tickets.map(ticket => 
      options.includeFields.map(field => {
        const value = this.getTicketFieldValue(ticket, field);
        if (typeof value === 'string' && value.length > 50) {
          return value.substring(0, 47) + '...';
        }
        return value || '';
      })
    );

    // Generate table
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 40,
      styles: { 
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 50 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
      },
      didDrawPage: (data) => {
        // Add page numbers at the bottom
        const pageCount = doc.getNumberOfPages();
        const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const pageText = `Page ${currentPage} of ${pageCount}`;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.text(pageText, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    });

    // Save PDF
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    doc.save(`tickets-export-${timestamp}.pdf`);
  }

  /**
   * Export tickets to JSON format
   */
  exportToJSON(tickets: Ticket[], options: ExportOptions): string {
    const exportData = tickets.map(ticket => this.ticketToExportObject(ticket, options.includeFields));
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Download exported data as file
   */
  downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Parse CSV file content
   */
  parseCSV(csvContent: string): any[] {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = this.parseCSVLine(lines[0]);
    const data = lines.slice(1).map((line, index) => {
      const values = this.parseCSVLine(line);
      const row: any = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      row._rowNumber = index + 2; // +2 because we start from line 2 and arrays are 0-indexed
      return row;
    });

    return data;
  }

  /**
   * Parse JSON file content
   */
  parseJSON(jsonContent: string): any[] {
    try {
      const data = JSON.parse(jsonContent);
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  /**
   * Parse Excel file content (.xlsx or .xls)
   */
  parseExcel(arrayBuffer: ArrayBuffer): any[] {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON with header row
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length < 2) {
        throw new Error('Excel file must have at least a header row and one data row');
      }
      
      // Convert array format to object format
      const headers = data[0] as string[];
      const rows = data.slice(1).map((row: any, index) => {
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = row[i] || '';
        });
        obj._rowNumber = index + 2; // +2 because we start from row 2 and arrays are 0-indexed
        return obj;
      });
      
      return rows;
    } catch (error) {
      throw new Error('Invalid Excel format or corrupted file');
    }
  }

  /**
   * Validate imported ticket data
   */
  validateTicketData(data: any[], options: ImportOptions): ImportResult {
    const result: ImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      errors: [],
      warnings: []
    };

    const requiredFields = ['subject', 'description', 'customerEmail'];
    const validStatuses = ['new', 'open', 'in_progress', 'resolved', 'closed'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];

    data.forEach((row, index) => {
      const rowNumber = row._rowNumber || index + 1;
      let hasErrors = false;

      // Check required fields
      requiredFields.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
          result.errors.push({
            row: rowNumber,
            field,
            message: `${field} is required`,
            data: row
          });
          hasErrors = true;
        }
      });

      // Validate email format
      if (row.customerEmail && !this.isValidEmail(row.customerEmail)) {
        result.errors.push({
          row: rowNumber,
          field: 'customerEmail',
          message: 'Invalid email format',
          data: row
        });
        hasErrors = true;
      }

      // Validate status
      if (row.status && !validStatuses.includes(row.status.toLowerCase())) {
        result.errors.push({
          row: rowNumber,
          field: 'status',
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          data: row
        });
        hasErrors = true;
      }

      // Validate priority
      if (row.priority && !validPriorities.includes(row.priority.toLowerCase())) {
        result.errors.push({
          row: rowNumber,
          field: 'priority',
          message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
          data: row
        });
        hasErrors = true;
      }

      // Validate dates
      if (row.createdAt && !this.isValidDate(row.createdAt)) {
        result.errors.push({
          row: rowNumber,
          field: 'createdAt',
          message: 'Invalid date format. Use YYYY-MM-DD or YYYY-MM-DD HH:mm:ss',
          data: row
        });
        hasErrors = true;
      }

      if (hasErrors) {
        result.failed++;
      } else {
        result.imported++;
      }
    });

    result.success = result.errors.length === 0;
    return result;
  }

  /**
   * Convert ticket data to import format
   */
  convertToTicketData(importData: any[], options: ImportOptions): Partial<Ticket>[] {
    return importData.map(row => {
      const ticket: Partial<Ticket> = {
        subject: row.subject?.toString().trim(),
        description: row.description?.toString().trim(),
        type: row.type?.toString().trim() || 'General',
        department: row.department?.toString().trim() || 'Support',
        priority: row.priority?.toString().toLowerCase().trim() || 'medium',
        status: row.status?.toString().toLowerCase().trim() || 'new',
        customerName: row.customerName?.toString().trim() || row.firstName + ' ' + row.lastName,
        customerEmail: row.customerEmail?.toString().trim(),
        assignedTo: row.assignedTo?.toString().trim(),
        assignedToName: row.assignedToName?.toString().trim(),
        resolution_comment: row.resolution_comment?.toString().trim(),
        ...options.defaultValues
      };

      // Parse dates
      if (row.createdAt) {
        ticket.createdAt = new Date(row.createdAt);
      }
      if (row.updatedAt) {
        ticket.updatedAt = new Date(row.updatedAt);
      }
      if (row.resolvedAt) {
        ticket.resolvedAt = new Date(row.resolvedAt);
      }

      return ticket;
    });
  }

  /**
   * Get available export fields
   */
  getAvailableExportFields(): string[] {
    return [
      'key',
      'subject',
      'description',
      'type',
      'department',
      'priority',
      'status',
      'customerName',
      'customerEmail',
      'assignedToName',
      'createdAt',
      'updatedAt',
      'resolvedAt',
      'resolution_comment'
    ];
  }

  /**
   * Get default export options
   */
  getDefaultExportOptions(): ExportOptions {
    return {
      format: 'csv',
      includeFields: [
        'key',
        'subject',
        'type',
        'department',
        'priority',
        'status',
        'customerName',
        'customerEmail',
        'assignedToName',
        'createdAt',
        'updatedAt'
      ]
    };
  }

  /**
   * Get default import options
   */
  getDefaultImportOptions(): ImportOptions {
    return {
      skipDuplicates: true,
      updateExisting: false,
      validateData: true,
      defaultValues: {
        status: 'new',
        priority: 'medium',
        type: 'General',
        department: 'Support'
      }
    };
  }

  // Private helper methods

  private getExportHeaders(fields: string[]): string[] {
    const fieldLabels: { [key: string]: string } = {
      key: 'Ticket Key',
      subject: 'Subject',
      description: 'Description',
      type: 'Type',
      department: 'Department',
      priority: 'Priority',
      status: 'Status',
      customerName: 'Customer Name',
      customerEmail: 'Customer Email',
      assignedToName: 'Assigned To',
      createdAt: 'Created Date',
      updatedAt: 'Updated Date',
      resolvedAt: 'Resolved Date',
      resolution_comment: 'Resolution Comment'
    };

    return fields.map(field => fieldLabels[field] || field);
  }

  private ticketToCSVRow(ticket: Ticket, fields: string[]): string {
    return fields.map(field => {
      const value = this.getTicketFieldValue(ticket, field);
      // Escape CSV values that contain commas, quotes, or newlines
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',');
  }

  private ticketToExportObject(ticket: Ticket, fields: string[]): any {
    const obj: any = {};
    fields.forEach(field => {
      obj[field] = this.getTicketFieldValue(ticket, field);
    });
    return obj;
  }

  private getTicketFieldValue(ticket: Ticket, field: string): any {
    switch (field) {
      case 'createdAt':
      case 'updatedAt':
      case 'resolvedAt': {
        const dateValue = ticket[field as keyof Ticket];
        if (!dateValue) return '';

        // Format date as: MM/DD/YYYY HH:MM:SS (readable format without T and Z)
        const date = new Date(dateValue as string | number | Date);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
      }
      default:
        return ticket[field as keyof Ticket] || '';
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
}
