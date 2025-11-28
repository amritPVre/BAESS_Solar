import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ChatSession, ArtifactData } from '@/types/solar-ai-chat';

/**
 * Export chat session with calculations to PDF
 */
export const exportToPDF = async (
  session: ChatSession,
  artifact: ArtifactData | null
): Promise<void> => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Header
    doc.setFillColor(37, 99, 235); // Blue
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('BAESS Labs', margin, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Solar Engineering AI Assistant', margin, 30);

    yPosition = 55;

    // Session Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(session.title, margin, yPosition);
    yPosition += 10;

    // Session Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Calculation Type: ${session.calculationType?.replace(/_/g, ' ').toUpperCase() || 'General'}`, margin, yPosition);
    yPosition += 15;

    // Horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Artifact/Calculation Results
    if (artifact) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Calculation Results', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Parse and format the artifact data
      const dataText = typeof artifact.data === 'string' 
        ? artifact.data 
        : JSON.stringify(artifact.data, null, 2);
      
      const lines = doc.splitTextToSize(dataText, pageWidth - 2 * margin);
      
      for (const line of lines) {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      }
      
      yPosition += 10;
    }

    // Conversation History
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Conversation History', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Add messages
    for (const message of session.messages) {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      // Message header
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(message.role === 'user' ? 37 : 99, 99, 235);
      doc.text(
        `${message.role === 'user' ? 'You' : 'AI Assistant'} - ${message.timestamp.toLocaleTimeString()}:`,
        margin,
        yPosition
      );
      yPosition += 6;

      // Message content
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const messageLines = doc.splitTextToSize(message.content, pageWidth - 2 * margin);
      
      for (const line of messageLines) {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      }
      
      yPosition += 8;
    }

    // Footer on last page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${totalPages} | BAESS Labs Solar AI Assistant`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    const fileName = `${session.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export to PDF');
  }
};

/**
 * Export calculations to Excel
 */
export const exportToExcel = async (
  session: ChatSession,
  artifact: ArtifactData | null
): Promise<void> => {
  try {
    const workbook = XLSX.utils.book_new();

    // Session Info Sheet
    const sessionInfo = [
      ['BAESS Labs - Solar Engineering AI Assistant'],
      [''],
      ['Session Title', session.title],
      ['Calculation Type', session.calculationType?.replace(/_/g, ' ').toUpperCase() || 'General'],
      ['Created', session.createdAt.toLocaleString()],
      ['Updated', session.updatedAt.toLocaleString()],
      ['Total Messages', session.messages.length],
      ['Generated', new Date().toLocaleString()],
    ];

    const sessionSheet = XLSX.utils.aoa_to_sheet(sessionInfo);
    
    // Style the header
    sessionSheet['A1'].s = {
      font: { bold: true, sz: 14 },
      fill: { fgColor: { rgb: "2563EB" } },
    };

    XLSX.utils.book_append_sheet(workbook, sessionSheet, 'Session Info');

    // Calculation Results Sheet
    if (artifact) {
      const resultsData = [
        ['Calculation Results'],
        [''],
        ['Title', artifact.title],
        ['Type', artifact.calculationType.replace(/_/g, ' ').toUpperCase()],
        ['Timestamp', artifact.timestamp.toLocaleString()],
        [''],
        ['Results:'],
        [''],
      ];

      // Add the actual calculation data
      const dataText = typeof artifact.data === 'string' 
        ? artifact.data 
        : JSON.stringify(artifact.data, null, 2);
      
      const dataLines = dataText.split('\n');
      dataLines.forEach(line => {
        resultsData.push([line]);
      });

      const resultsSheet = XLSX.utils.aoa_to_sheet(resultsData);
      XLSX.utils.book_append_sheet(workbook, resultsSheet, 'Calculation Results');
    }

    // Conversation Sheet
    const conversationData = [
      ['Role', 'Timestamp', 'Message'],
    ];

    session.messages.forEach(message => {
      conversationData.push([
        message.role === 'user' ? 'You' : 'AI Assistant',
        message.timestamp.toLocaleString(),
        message.content.substring(0, 32767), // Excel cell limit
      ]);
    });

    const conversationSheet = XLSX.utils.aoa_to_sheet(conversationData);
    
    // Set column widths
    conversationSheet['!cols'] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 80 },
    ];

    XLSX.utils.book_append_sheet(workbook, conversationSheet, 'Conversation');

    // Save the Excel file
    const fileName = `${session.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export to Excel');
  }
};

/**
 * Export just the artifact/calculation results to PDF
 */
export const exportArtifactToPDF = async (artifact: ArtifactData): Promise<void> => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Calculation Report', margin, 25);

    yPosition = 55;

    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(artifact.title, margin, yPosition);
    yPosition += 10;

    // Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Type: ${artifact.calculationType.replace(/_/g, ' ').toUpperCase()}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Generated: ${artifact.timestamp.toLocaleString()}`, margin, yPosition);
    yPosition += 15;

    // Line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Results
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Results', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const dataText = typeof artifact.data === 'string' 
      ? artifact.data 
      : JSON.stringify(artifact.data, null, 2);
    
    const lines = doc.splitTextToSize(dataText, pageWidth - 2 * margin);
    
    for (const line of lines) {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 5;
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${totalPages} | BAESS Labs`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    const fileName = `${artifact.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error exporting artifact to PDF:', error);
    throw new Error('Failed to export to PDF');
  }
};

