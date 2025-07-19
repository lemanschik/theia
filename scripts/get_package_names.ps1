Get-ChildItem -Path 'packages/*/package.json' | ForEach-Object { (Get-Content $_.FullName | ConvertFrom-Json).name }
