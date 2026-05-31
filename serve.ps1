# Windows 네이티브 로컬 웹 서버 스크립트 (Node.js/Python 미설치 대비용)
$port = 8000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host " 과학 마스터 도감 로컬 웹 서버 구동 중..." -ForegroundColor Green
    Write-Host " 접속 주소: http://localhost:$port/" -ForegroundColor Green
    Write-Host " 서버를 종료하려면 Ctrl+C 키를 누르세요." -ForegroundColor Yellow
    Write-Host "==================================================" -ForegroundColor Cyan
    
    while ($listener.IsListening) {
        $context = $null
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response
            
            $urlPath = $request.Url.LocalPath
            # 트레일링 슬래시 제거 (루트 제외)
            if ($urlPath -ne "/" -and $urlPath.EndsWith("/")) {
                $urlPath = $urlPath.Substring(0, $urlPath.Length - 1)
            }
            
            # 기본 인덱스 처리
            if ($urlPath -eq "/" -or $urlPath -eq "") {
                $urlPath = "/index.html"
            }
            
            # 경로 변환 (Windows 역슬래시 매핑) - out 폴더 아래의 정적 배포본 서빙
            $relPath = $urlPath.Replace("/", "\").TrimStart("\")
            $filePath = Join-Path $PSScriptRoot "out\$relPath"
            
            # Clean URL 처리 (예: /teacher/create -> /teacher/create.html)
            if (-not (Test-Path $filePath -PathType Leaf) -and (Test-Path "$filePath.html" -PathType Leaf)) {
                $filePath = "$filePath.html"
            }
            
            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                # 모듈 로딩 및 폰트/데이터 지원을 위한 MIME Type 명시
                $mime = switch ($ext) {
                    ".html" { "text/html; charset=utf-8" }
                    ".css" { "text/css; charset=utf-8" }
                    ".js" { "application/javascript; charset=utf-8" }
                    ".json" { "application/json; charset=utf-8" }
                    ".png" { "image/png" }
                    ".jpg" { "image/jpeg" }
                    ".svg" { "image/svg+xml" }
                    ".ico" { "image/x-icon" }
                    ".woff" { "font/woff" }
                    ".woff2" { "font/woff2" }
                    ".ttf" { "font/ttf" }
                    Default { "application/octet-stream" }
                }
                
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentType = $mime
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write([byte[]]$bytes, 0, $bytes.Length)
                Write-Host "GET (200) - $urlPath -> $filePath" -ForegroundColor Gray
            } else {
                $response.StatusCode = 404
                $errText = "404 File Not Found"
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes($errText)
                $response.ContentType = "text/plain; charset=utf-8"
                $response.ContentLength64 = $errBytes.Length
                $response.OutputStream.Write([byte[]]$errBytes, 0, $errBytes.Length)
                Write-Host "GET (404) - $urlPath (Not Found)" -ForegroundColor Red
            }
        } catch {
            Write-Host "요청 처리 오류: $_" -ForegroundColor Yellow
        } finally {
            if ($context -and $context.Response) {
                try { $context.Response.Close() } catch {}
            }
        }
    }
} catch {
    Write-Host "서버 구동 오류: $_" -ForegroundColor Red
} finally {
    if ($listener) {
        $listener.Close()
    }
}
