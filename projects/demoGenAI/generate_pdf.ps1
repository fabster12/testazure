# Upload markdown file to API using curl
# ./upload_curl.ps1 -InputFile "PROJECT_SUMMARY.md" -OutputName PROJECT_SUMMARY.pdf"
param(
    [string]$InputFile = "PROJECT_SUMMARY.md",
    [string]$OutputName = "PROJECT_SUMMARY.pdf"
)

$content = (Get-Content -Path $InputFile -Raw | ConvertTo-Json)
$body = "{`"markdown_content`":$content,`"output_name`":`"$OutputName`"}"

curl.exe -X POST http://localhost:8080/api/upload-and-generate `
  -H "Content-Type: application/json" `
  -H "X-API-Key: test-api-key-12345" `
  -d $body