# =============================================================================
#  ЗАРЯ — локальный сервер для проверки
# -----------------------------------------------------------------------------
#  Сайт полностью работает и по file:// (двойной клик по index.html), но
#  некоторые вещи проверяются только по http://: страница 404, robots.txt,
#  sitemap.xml и заголовки безопасности.
#
#  Запуск:  powershell -ExecutionPolicy Bypass -File serve.ps1
#  Адрес:   http://localhost:8123/     Остановка: Ctrl+C
#
#  ВАЖНО: это сервер для разработки, а не для продакшена. Заголовки ниже —
#  образец того, что нужно настроить на реальном хостинге (Nginx, Caddy,
#  Netlify, Cloudflare Pages). Их список продублирован в README.
# =============================================================================

param(
  [int]$Port = 8123
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.webp' = 'image/webp'
  '.ico'  = 'image/x-icon'
  '.txt'  = 'text/plain; charset=utf-8'
  '.xml'  = 'application/xml; charset=utf-8'
  '.woff2'= 'font/woff2'
}

# Хеш инлайн-блока JSON-LD в index.html. Если правите разметку schema.org —
# пересчитайте: см. раздел «Безопасность» в README.
$jsonLdHash = "'sha256-dURyh8roZfhHa5zmi+iD19i+djMIO9sXvVNyA9XKryA='"

$csp = @(
  "default-src 'self'",
  "script-src 'self' $jsonLdHash",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "object-src 'none'"
) -join '; '

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")

try {
  $listener.Start()
} catch {
  Write-Host "Не удалось занять порт $Port. Попробуйте другой: -Port 8124" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "  ЗАРЯ — http://localhost:$Port/" -ForegroundColor Yellow
Write-Host "  Папка: $root"
Write-Host "  Остановка: Ctrl+C"
Write-Host ""

while ($listener.IsListening) {
  try {
    $context  = $listener.GetContext()
    $request  = $context.Request
    $response = $context.Response

    $path = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
    if ($path -eq '/') { $path = '/index.html' }

    # Защита от выхода за пределы папки (../../secrets)
    $target = Join-Path $root ($path.TrimStart('/') -replace '/', '\')
    $full   = [System.IO.Path]::GetFullPath($target)

    $status = 200
    if (-not $full.StartsWith([System.IO.Path]::GetFullPath($root), [System.StringComparison]::OrdinalIgnoreCase)) {
      $full = Join-Path $root '404.html'
      $status = 403
    } elseif (-not (Test-Path $full -PathType Leaf)) {
      $full = Join-Path $root '404.html'
      $status = 404
    }

    $ext = [System.IO.Path]::GetExtension($full).ToLower()
    $type = $mime[$ext]
    if (-not $type) { $type = 'application/octet-stream' }

    $bytes = [System.IO.File]::ReadAllBytes($full)

    $response.StatusCode = $status
    $response.ContentType = $type
    $response.Headers.Add('Content-Security-Policy', $csp)
    $response.Headers.Add('X-Content-Type-Options', 'nosniff')
    $response.Headers.Add('Referrer-Policy', 'strict-origin-when-cross-origin')
    $response.Headers.Add('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), interest-cohort=()')
    $response.Headers.Add('X-Frame-Options', 'DENY')
    $response.Headers.Add('Cache-Control', 'no-store')

    $response.ContentLength64 = $bytes.Length
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
    $response.OutputStream.Close()

    $mark = if ($status -eq 200) { 'OK ' } else { "$status" }
    Write-Host ("  {0}  {1}" -f $mark, $path)
  } catch {
    # Один сорвавшийся запрос не должен ронять сервер
    if ($context -and $context.Response) {
      try { $context.Response.Abort() } catch {}
    }
  }
}
