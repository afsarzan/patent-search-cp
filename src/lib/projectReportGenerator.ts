import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Project, SavedSearch, PatentReference, Comment } from '@/types/projects';

interface ProjectReportData {
  project: Project;
  searches: SavedSearch[];
  patents: PatentReference[];
  comments: Comment[];
}

function generateReportHTML(data: ProjectReportData): string {
  const { project, searches, patents, comments } = data;
  const now = new Date().toLocaleDateString();

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #333;
          line-height: 1.6;
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px;
          background: white;
        }
        .header {
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        h1 {
          margin: 0 0 10px 0;
          color: #1e40af;
          font-size: 28px;
        }
        .meta {
          font-size: 14px;
          color: #666;
          margin: 10px 0;
        }
        .description {
          font-size: 16px;
          margin: 15px 0;
          color: #555;
        }
        h2 {
          color: #1e40af;
          font-size: 20px;
          border-left: 4px solid #2563eb;
          padding-left: 12px;
          margin-top: 30px;
          margin-bottom: 15px;
          page-break-after: avoid;
        }
        .section {
          margin-bottom: 30px;
        }
        .search-card {
          border: 1px solid #ddd;
          padding: 15px;
          margin-bottom: 15px;
          border-radius: 6px;
          background: #f9fafb;
          page-break-inside: avoid;
        }
        .search-query {
          font-weight: bold;
          font-size: 16px;
          color: #1e40af;
          margin-bottom: 8px;
        }
        .search-meta {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          font-size: 13px;
          margin: 10px 0;
        }
        .search-meta-item {
          color: #666;
        }
        .search-meta-label {
          font-weight: 600;
          color: #333;
        }
        .search-notes {
          margin-top: 10px;
          padding: 10px;
          background: white;
          border-left: 3px solid #2563eb;
          font-size: 13px;
          color: #555;
        }
        .patent-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        .patent-card {
          border: 1px solid #ddd;
          padding: 12px;
          border-radius: 6px;
          background: #fafbfc;
          page-break-inside: avoid;
        }
        .patent-title {
          font-weight: bold;
          font-size: 14px;
          color: #1e40af;
          margin-bottom: 6px;
          line-height: 1.4;
        }
        .patent-assignee {
          font-size: 12px;
          color: #666;
          margin-bottom: 6px;
        }
        .patent-dates {
          font-size: 11px;
          color: #999;
          margin-bottom: 8px;
        }
        .patent-abstract {
          font-size: 12px;
          color: #555;
          line-height: 1.4;
          max-height: 80px;
          overflow: hidden;
        }
        .comment-card {
          border-left: 4px solid #2563eb;
          padding: 12px;
          margin-bottom: 12px;
          background: #f0f7ff;
          border-radius: 4px;
          page-break-inside: avoid;
        }
        .comment-header {
          font-weight: bold;
          font-size: 13px;
          color: #1e40af;
          margin-bottom: 6px;
        }
        .comment-date {
          font-size: 11px;
          color: #999;
        }
        .comment-content {
          font-size: 13px;
          color: #333;
          margin-top: 6px;
          line-height: 1.5;
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 15px;
          margin: 15px 0;
        }
        .stat-box {
          padding: 10px;
          background: #f0f7ff;
          border: 1px solid #bfdbfe;
          border-radius: 4px;
          text-align: center;
        }
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
        }
        .stat-label {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #999;
          text-align: center;
        }
        @media print {
          body {
            padding: 20px;
          }
          .page-break {
            page-break-after: always;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${escapeHtml(project.name)}</h1>
        <div class="meta">
          <p><strong>Generated:</strong> ${now}</p>
          <p><strong>Created:</strong> ${new Date(project.createdAt).toLocaleDateString()}</p>
        </div>
        ${project.description ? `<div class="description">${escapeHtml(project.description)}</div>` : ''}
      </div>

      <div class="stats-row">
        <div class="stat-box">
          <div class="stat-number">${searches.length}</div>
          <div class="stat-label">Saved Searches</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${patents.length}</div>
          <div class="stat-label">Pinned Patents</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${comments.length}</div>
          <div class="stat-label">Notes</div>
        </div>
      </div>

      ${searches.length > 0 ? `
        <h2>📊 Saved Searches</h2>
        <div class="section">
          ${searches.map((search) => `
            <div class="search-card">
              <div class="search-query">${escapeHtml(search.queryString)}</div>
              <div class="search-meta">
                <div class="search-meta-item">
                  <span class="search-meta-label">Results:</span> ${search.resultCount.toLocaleString()}
                </div>
                <div class="search-meta-item">
                  <span class="search-meta-label">Providers:</span> ${search.providers.join(', ')}
                </div>
                ${search.earliestFilingYear ? `
                  <div class="search-meta-item">
                    <span class="search-meta-label">Years:</span> ${search.earliestFilingYear}–${search.latestFilingYear}
                  </div>
                ` : ''}
                <div class="search-meta-item">
                  <span class="search-meta-label">Run:</span> ${new Date(search.runAt).toLocaleDateString()}
                </div>
              </div>
              ${search.notes ? `<div class="search-notes">${escapeHtml(search.notes)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${patents.length > 0 ? `
        <h2>📋 Pinned Patents</h2>
        <div class="section">
          <div class="patent-grid">
            ${patents.map((patent) => `
              <div class="patent-card">
                <div class="patent-title">${escapeHtml(patent.patentData.title)}</div>
                <div class="patent-assignee">${escapeHtml(patent.patentData.assignee)}</div>
                <div class="patent-dates">
                  Filed: ${patent.patentData.filingDate} | Granted: ${patent.patentData.grantDate}
                </div>
                <div class="patent-abstract">${escapeHtml(patent.patentData.abstract)}</div>
                ${patent.notes ? `<div style="margin-top: 8px; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 6px;">${escapeHtml(patent.notes)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${comments.length > 0 ? `
        <h2>💬 Notes & Discussion</h2>
        <div class="section">
          ${comments.map((comment) => `
            <div class="comment-card">
              <div class="comment-header">${escapeHtml(comment.author?.name || 'Anonymous')}</div>
              <div class="comment-date">${new Date(comment.createdAt).toLocaleString()}</div>
              <div class="comment-content">${escapeHtml(comment.content)}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="footer">
        <p>Patent Explorer Research Report • ${project.name}</p>
        <p>Generated on ${now}</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

export async function generateProjectPDF(data: ProjectReportData): Promise<void> {
  const html = generateReportHTML(data);

  // Create a temporary container for rendering
  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '1000px';
  container.style.backgroundColor = 'white';
  document.body.appendChild(container);

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let position = 0;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgData = canvas.toDataURL('image/png');

    // Add images to PDF, creating new pages as needed
    while (position < imgHeight) {
      const heightLeft = imgHeight - position;

      if (position > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight);
      position += pageHeight;
    }

    // Download PDF
    const filename = `${data.project.name.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}
