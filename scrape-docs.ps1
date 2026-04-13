$urls = @(
    "https://trurominorhockey.ca/uploads/truromha/source/0/Coaches%20Corner/Coach%20and%20Managers%20Reference%20Guide%202022%20-%20letter%20vesion.pdf",
    "https://trurominorhockey.ca/uploads/truromha/source/0/Managers%20Desk/Hockey%20Canada%20Managers%20Guide.pdf",
    "https://trurominorhockey.ca/uploads/truromha/source/0/Managers%20Desk/Bench%20Staff%20Code%20of%20Conduct.pdf",
    "https://trurominorhockey.ca/uploads/truromha/source/0/Managers%20Desk/Code%20of%20Conduct%202022.pdf",
    "https://trurominorhockey.ca/uploads/truromha/source/0/Managers%20Desk/Budget%20-%20C%20League%20-%20Sample.pdf",
    "https://trurominorhockey.ca/uploads/truromha/source/0/Managers%20Desk/Budget%20-%20Rep%20team%20-%20Sample.pdf",
    "https://trurominorhockey.ca/uploads/truromha/source/0/Managers%20Desk/TAMHA%20Jersey%20Signout%20form%20and%20Guidelines%202023%20update.pdf",
    "https://trurominorhockey.ca/uploads/truromha/source/0/Managers%20Desk/Player%20Medical%20Form.pdf",
    "https://trurominorhockey.ca/uploads/truromha/source/0/Managers%20Desk/InjuryReport_NovaScotia_2021.pdf"
)

$outDir = "original-pdfs"
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir
}

foreach ($url in $urls) {
    # Extract filename from URL and decode it
    $filename = [System.Uri]::UnescapeDataString(($url -split '/')[-1])
    $outputPath = Join-Path $outDir $filename
    Write-Host "Downloading $filename..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $outputPath
        Write-Host "Success: $filename"
    } catch {
        Write-Host "Failed to download $url : $_"
    }
}
Write-Host "Scraping complete."
