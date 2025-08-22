export interface UploadResult {
  baseImageId: string
  url: string
}

export async function uploadImageViaApi(
  fileOrBlob: File | Blob,
  filename = "upload.png",
  sessionId?: string
): Promise<UploadResult> {
  const form = new FormData()

  // Prefer using the provided value directly to avoid relying on File constructor in tests
  let name = filename
  const anyVal: any = fileOrBlob as any
  if (anyVal && typeof anyVal.name === "string" && anyVal.name.length > 0) {
    name = anyVal.name
  }

  // Append Blob or File with a filename (FormData supports Blob)
  form.append("file", fileOrBlob as Blob, name)

  if (sessionId) form.append("sessionId", sessionId)
  const res = await fetch("/api/images/upload", { method: "POST", body: form })
  if (!res.ok) {
    let message = `Upload failed (${res.status})`
    try {
      const j = await res.json()
      if (j?.error) message = j.error
    } catch {
      // ignore
    }
    throw new Error(message)
  }
  return res.json()
}
