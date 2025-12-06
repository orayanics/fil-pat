param(
    [string]$IconPath = "assets\icons\icon.ico"
)

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$fullPath = Join-Path -Path $workspaceRoot -ChildPath $IconPath

if (-not (Test-Path -LiteralPath $fullPath)) {
    Write-Error "Icon not found: $fullPath"
    exit 1
}

Write-Output "Path: $fullPath"
$bytes = [System.IO.File]::ReadAllBytes($fullPath)
$count = [System.BitConverter]::ToUInt16($bytes, 4)
Write-Output "Image count: $count"

for ($i = 0; $i -lt $count; $i++) {
    $entryOffset = 6 + (16 * $i)
    $widthByte = $bytes[$entryOffset]
    $heightByte = $bytes[$entryOffset + 1]
    $width = if ($widthByte -eq 0) { 256 } else { $widthByte }
    $height = if ($heightByte -eq 0) { 256 } else { $heightByte }
    $bitsPerPixel = [System.BitConverter]::ToUInt16($bytes, $entryOffset + 6)
    $bytesInRes = [System.BitConverter]::ToUInt32($bytes, $entryOffset + 8)
    Write-Output (" - Entry {0}: {1}x{2} {3}-bit ({4} bytes)" -f ($i + 1), $width, $height, $bitsPerPixel, $bytesInRes)
}
