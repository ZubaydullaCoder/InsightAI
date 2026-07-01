export function formatMahallaLabel(mahallaName: string): string {
  return mahallaName
    .replace(/\s+mahallasi$/i, ' МФЙ')
    .replace(/\s+маҳалласи$/i, ' МФЙ')
    .replace(/\s+махалласи$/i, ' МФЙ')
}
