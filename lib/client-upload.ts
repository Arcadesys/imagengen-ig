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
  const file =
    fileOrBlob instanceof File
      ? fileOrBlob
      : new File([fileOrBlob], filename, { type: (fileOrBlob as any).type || "image/png" })
  form.append("file", file)
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
