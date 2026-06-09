import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx'

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  triggerDownload(blob, `${filename}.md`)
}

export async function downloadDocx(content: string, filename: string) {
  const lines = content.split('\n')
  const children: Paragraph[] = []

  for (const line of lines) {
    if (line.startsWith('# ')) {
      children.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 }))
    } else if (line.startsWith('## ')) {
      children.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 }))
    } else if (line.startsWith('### ')) {
      children.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 }))
    } else if (line.trim() === '') {
      children.push(new Paragraph({ text: '' }))
    } else {
      const stripped = line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
      children.push(new Paragraph({ children: [new TextRun(stripped)] }))
    }
  }

  const doc = new Document({ sections: [{ children }] })
  const blob = await Packer.toBlob(doc)
  triggerDownload(blob, `${filename}.docx`)
}

export function downloadPdf(content: string, filename: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const maxWidth = pageWidth - margin * 2
  let y = margin

  doc.setFont('helvetica')
  const lines = content.split('\n')

  for (const line of lines) {
    if (y > 270) { doc.addPage(); y = margin }

    if (line.startsWith('# ')) {
      doc.setFontSize(18); doc.setFont('helvetica', 'bold')
      const wrapped = doc.splitTextToSize(line.slice(2), maxWidth) as string[]
      doc.text(wrapped, margin, y); y += wrapped.length * 8 + 4
    } else if (line.startsWith('## ')) {
      doc.setFontSize(14); doc.setFont('helvetica', 'bold')
      const wrapped = doc.splitTextToSize(line.slice(3), maxWidth) as string[]
      doc.text(wrapped, margin, y); y += wrapped.length * 7 + 3
    } else if (line.startsWith('### ')) {
      doc.setFontSize(12); doc.setFont('helvetica', 'bold')
      const wrapped = doc.splitTextToSize(line.slice(4), maxWidth) as string[]
      doc.text(wrapped, margin, y); y += wrapped.length * 6 + 2
    } else if (line.trim() === '') {
      y += 4
    } else {
      doc.setFontSize(10); doc.setFont('helvetica', 'normal')
      const stripped = line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`(.*?)`/g, '$1')
      const wrapped = doc.splitTextToSize(stripped, maxWidth) as string[]
      doc.text(wrapped, margin, y); y += wrapped.length * 5 + 1
    }
  }

  doc.save(`${filename}.pdf`)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
