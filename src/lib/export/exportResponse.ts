export function csvAttachmentResponse(
  filename: string,
  content: string,
  status = 200
): Response {
  return new Response(content, {
    status,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}

export function exportErrorResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
