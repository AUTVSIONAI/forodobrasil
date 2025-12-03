$ErrorActionPreference = 'Stop'
$envPath = Join-Path $PSScriptRoot '..\.env.local'
$vars = @{}
Get-Content $envPath | ForEach-Object {
  if($_ -match '^(?<k>[^=]+)=(?<v>.*)$') {
    $vars[$Matches.k] = $Matches.v
  }
}
$base = $vars['NEXT_PUBLIC_SUPABASE_URL']
$key = $vars['SUPABASE_SERVICE_ROLE_KEY']
if(-not $base -or -not $key){ throw 'Env inválido' }
$headers = @{ apikey = $key; Authorization = "Bearer $key" }
$body = @{ email = 'admin@forodobrasil.org'; password = 'gtuvx809xlq@'; email_confirm = $true } | ConvertTo-Json
$resp = Invoke-RestMethod -Uri ($base + '/auth/v1/admin/users') -Method POST -Headers $headers -ContentType 'application/json' -Body $body
$uid = $resp.id
if(-not $uid){ throw 'Falha ao criar usuário' }
$headers2 = @{ apikey = $key; Authorization = "Bearer $key"; Prefer = 'return=representation' }
$body2 = @{ user_id = $uid; full_name = 'Admin ForoBrasil'; role = 'admin' } | ConvertTo-Json
$profile = Invoke-RestMethod -Uri ($base + '/rest/v1/user_profiles') -Method POST -Headers $headers2 -ContentType 'application/json' -Body $body2
Write-Host ('Admin criado: ' + $uid)
