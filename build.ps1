# WhatsHide Automated Packaging Script v6.6
Write-Host "🚀 Packaging WhatsHide Chrome Extension v6.6..." -ForegroundColor Green

$SourceDir = "C:\Users\AMEER\Desktop\New folder\WhatsHide"
$ZipOutput = "C:\Users\AMEER\Desktop\WhatsHide_Extension.zip"

if (Test-Path $ZipOutput) {
    Remove-Item $ZipOutput -Force
    Write-Host "🧹 Cleaned old ZIP archive." -ForegroundColor Yellow
}

# Verify JS Syntax
node -c "$SourceDir\content.js" "$SourceDir\popup.js" "$SourceDir\background.js"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Syntax check failed! Aborting packaging." -ForegroundColor Red
    exit 1
}
Write-Host "✅ JavaScript Syntax Check Passed." -ForegroundColor Green

# Create Zip Archive excluding developer documentation and landing page
$filesToZip = Get-ChildItem -Path $SourceDir -Exclude "*.md", "build.ps1", ".git*", "landing"
Compress-Archive -Path $filesToZip.FullName -DestinationPath $ZipOutput -Force

Write-Host "🎉 Package created successfully at: $ZipOutput" -ForegroundColor Green
Write-Host "Ready for upload to Chrome Web Store Developer Console!" -ForegroundColor Cyan
