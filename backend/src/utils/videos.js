// Video links for learning resources: YouTube, Facebook or Vimeo. Videos are
// linked rather than uploaded, so playback is handled by those services.

// → { provider, url, embedUrl, thumbnailUrl } or null when the link isn't supported.
export function parseVideoUrl(raw) {
  let url
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  const host = url.hostname.replace(/^(www|m)\./, '')

  let youtubeId = null
  if (host === 'youtu.be') youtubeId = url.pathname.slice(1)
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    youtubeId = url.searchParams.get('v') ?? url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] ?? null
  }
  if (youtubeId && /^[\w-]{11}$/.test(youtubeId)) {
    return {
      provider: 'youtube',
      url: `https://www.youtube.com/watch?v=${youtubeId}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    }
  }

  if (host === 'vimeo.com') {
    const id = url.pathname.match(/^\/(\d+)/)?.[1]
    if (id) return { provider: 'vimeo', url: `https://vimeo.com/${id}`, embedUrl: `https://player.vimeo.com/video/${id}`, thumbnailUrl: null }
  }

  if ((host === 'facebook.com' && /\/(videos|watch|reel)/.test(url.pathname + url.search)) || host === 'fb.watch') {
    const clean = `https://www.facebook.com${host === 'fb.watch' ? '' : url.pathname}${url.searchParams.get('v') ? `?v=${url.searchParams.get('v')}` : ''}`
    const href = host === 'fb.watch' ? url.href : clean
    return {
      provider: 'facebook',
      url: href,
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(href)}&show_text=false`,
      thumbnailUrl: null,
    }
  }
  return null
}
