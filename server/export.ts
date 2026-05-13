/**
 * Export utilities for generating CSV and Excel files
 */

export function generateCSV(data: any[], headers: string[]): string {
  const rows = [headers.join(',')];
  
  for (const item of data) {
    const row = headers.map(header => {
      const value = item[header];
      if (value === null || value === undefined) return '';
      
      // Escape quotes and wrap in quotes if contains comma or newline
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    rows.push(row.join(','));
  }
  
  return rows.join('\n');
}

export function formatDocumentsForExport(documents: any[]) {
  return documents.map(doc => ({
    id: doc.id,
    filename: doc.filename || doc.originalFilename,
    fileType: doc.fileType,
    fileSize: doc.fileSize,
    status: doc.status,
    totalChunks: doc.totalChunks || 0,
    tags: doc.tags || '',
    description: doc.description || '',
    userName: doc.userName || '',
    userEmail: doc.userEmail || '',
    createdAt: doc.createdAt ? new Date(doc.createdAt).toLocaleString('pt-BR') : '',
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toLocaleString('pt-BR') : '',
  }));
}

export function formatFeedbackForExport(feedback: any[]) {
  return feedback.map(item => ({
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    priority: item.priority,
    status: item.status,
    userName: item.userName || '',
    userEmail: item.userEmail || '',
    adminResponse: item.adminResponse || '',
    createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : '',
  }));
}

export function formatAnalyticsForExport(analytics: any[]) {
  return analytics.map(item => ({
    date: item.date || item.userId || item.fileType,
    count: item.count || item.documentCount,
    value: item.value || item.totalSize || '',
  }));
}
