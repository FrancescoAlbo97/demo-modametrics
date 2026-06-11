const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

async function postMultipart<T>(path: string, form: FormData, token: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })

  if (!res.ok) {
    let message = `Errore ${res.status}`
    try {
      const err = await res.json()
      if (err.detail) message = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail)
    } catch {}
    throw new Error(message)
  }

  return res.json() as Promise<T>
}

export function ingestPosts(jsonFile: File, imagesZip: File | undefined, token: string) {
  const form = new FormData()
  form.append('json_file', jsonFile)
  if (imagesZip) form.append('images_zip', imagesZip)
  return postMultipart('/api/ingest/posts', form, token)
}

export function ingestVisualAnalysis(jsonFile: File, token: string) {
  const form = new FormData()
  form.append('json_file', jsonFile)
  return postMultipart('/api/ingest/visual-analysis', form, token)
}

export function ingestDatappeal(segment: string, csvZip: File, token: string) {
  const form = new FormData()
  form.append('segment', segment)
  form.append('csv_zip', csvZip)
  return postMultipart('/api/ingest/datappeal', form, token)
}

export function ingestPatPosts(
  patName: string,
  jsonFile: File,
  imagesZip: File | undefined,
  token: string,
) {
  const form = new FormData()
  form.append('pat_name', patName)
  form.append('json_file', jsonFile)
  if (imagesZip) form.append('images_zip', imagesZip)
  return postMultipart('/api/ingest/pat/posts', form, token)
}

export function ingestPatDescription(jsonFile: File, token: string) {
  const form = new FormData()
  form.append('json_file', jsonFile)
  return postMultipart('/api/ingest/pat/description', form, token)
}
