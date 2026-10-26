export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return 'N/A';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'kB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return num.toLocaleString();
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    const formatted = d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    if (diffDays <= 1) return `${formatted} (today)`;
    if (diffDays < 30) return `${formatted} (${diffDays}d ago)`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${formatted} (${months}mo ago)`;
    }
    const years = (diffDays / 365).toFixed(1);
    return `${formatted} (${years}y ago)`;
  } catch {
    return 'N/A';
  }
}
