import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SystemSetting {
  id: number;
  key: string; // e.g., 'max_file_size', 'allowed_file_types', 'max_files_per_ticket'
  value: string; // JSON string for complex values
  label: string; // Human readable label
  description?: string;
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'array';
  category: 'file_upload' | 'email' | 'system' | 'ui' | 'security';
  isEditable: boolean; // Some settings should only be changed by super admin
  isActive: boolean; // Whether this setting is currently active/enabled
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateSystemSettingRequest {
  key: string;
  value: string;
  label: string;
  description?: string;
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'array';
  category: 'file_upload' | 'email' | 'system' | 'ui' | 'security';
  isEditable?: boolean;
  isActive?: boolean;
}

export interface FileUploadSettings {
  maxFileSize: number;
  allowedFileTypes: string[];
  maxFilesPerTicket: number;
}

@Injectable({
  providedIn: 'root'
})
export class SystemSettingsService {
  private http = inject(HttpClient);

  private apiUrl = environment.apiUrl + '/api/system-settings';

  getSettings(): Observable<SystemSetting[]> {
    return this.http.get<SystemSetting[]>(this.apiUrl);
  }

  getSettingsByCategory(category: string): Observable<SystemSetting[]> {
    return this.http.get<SystemSetting[]>(`${this.apiUrl}/category/${category}`);
  }

  getSettingByKey(key: string): Observable<SystemSetting> {
    return this.http.get<SystemSetting>(`${this.apiUrl}/key/${key}`);
  }

  createSetting(settingData: CreateSystemSettingRequest): Observable<SystemSetting> {
    return this.http.post<SystemSetting>(this.apiUrl, settingData);
  }

  updateSetting(id: number, settingData: Partial<SystemSetting>): Observable<SystemSetting> {
    return this.http.put<SystemSetting>(`${this.apiUrl}/${id}`, settingData);
  }

  deleteSetting(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Helper methods for common settings
  getFileUploadSettings(): Observable<FileUploadSettings> {
    return this.http.get<FileUploadSettings>(`${this.apiUrl}/file-upload-config`);
  }
}