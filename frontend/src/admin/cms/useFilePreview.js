import { useEffect, useState } from 'react'
import { getFileBlob } from '../../api/admin.api.js'

// Object URL for a stored file (also unpublished ones), fetched with the
// signed-in user's token. Revoked when the component goes away.
export default function useFilePreview(fileId, enabled = true) {
  const [preview, setPreview] = useState({ fileId: null, url: null })
  useEffect(() => {
    if (!fileId || !enabled) return
    let objectUrl
    let current = true
    getFileBlob(fileId).then(
      (blob) => {
        objectUrl = URL.createObjectURL(blob)
        if (current) setPreview({ fileId, url: objectUrl })
      },
      () => {},
    )
    return () => {
      current = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [fileId, enabled])
  return enabled && preview.fileId === fileId ? preview.url : null
}
