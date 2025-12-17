$files = Get-ChildItem -Path "src\app\(website)" -Recurse -Filter "*.tsx"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalHash = $content.GetHashCode()
    
    # Remove imports
    $content = $content -replace 'import\s+Header\s+from\s+["'']@/components/layout/Header["''];?\r?\n?', ''
    $content = $content -replace 'import\s+Footer\s+from\s+["'']@/components/layout/Footer["''];?\r?\n?', ''
    
    # Remove Components
    $content = $content -replace '<Header\s*/>\r?\n?', ''
    $content = $content -replace '<Footer\s*/>\r?\n?', ''
    
    if ($content.GetHashCode() -ne $originalHash) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "Updated $($file.Name)"
    }
}
