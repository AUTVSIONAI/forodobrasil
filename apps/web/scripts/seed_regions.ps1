$ErrorActionPreference = 'Stop'
$envPath = Join-Path $PSScriptRoot '..\.env.local'
$vars = @{}
Get-Content $envPath | ForEach-Object {
  if($_ -match '^(?<k>[^=]+)=(?<v>.*)$') { $vars[$Matches.k] = $Matches.v }
}
$base = $vars['NEXT_PUBLIC_SUPABASE_URL']
$key = $vars['SUPABASE_SERVICE_ROLE_KEY']
if(-not $base -or -not $key){ throw 'Env inválido' }
$headers = @{ apikey = $key; Authorization = "Bearer $key"; Prefer = 'return=representation' }
$regions = @(
  @{ code='AC'; name='Acre' },
  @{ code='AL'; name='Alagoas' },
  @{ code='AP'; name='Amapá' },
  @{ code='AM'; name='Amazonas' },
  @{ code='BA'; name='Bahia' },
  @{ code='CE'; name='Ceará' },
  @{ code='DF'; name='Distrito Federal' },
  @{ code='ES'; name='Espírito Santo' },
  @{ code='GO'; name='Goiás' },
  @{ code='MA'; name='Maranhão' },
  @{ code='MT'; name='Mato Grosso' },
  @{ code='MS'; name='Mato Grosso do Sul' },
  @{ code='MG'; name='Minas Gerais' },
  @{ code='PA'; name='Pará' },
  @{ code='PB'; name='Paraíba' },
  @{ code='PR'; name='Paraná' },
  @{ code='PE'; name='Pernambuco' },
  @{ code='PI'; name='Piauí' },
  @{ code='RJ'; name='Rio de Janeiro' },
  @{ code='RN'; name='Rio Grande do Norte' },
  @{ code='RS'; name='Rio Grande do Sul' },
  @{ code='RO'; name='Rondônia' },
  @{ code='RR'; name='Roraima' },
  @{ code='SC'; name='Santa Catarina' },
  @{ code='SP'; name='São Paulo' },
  @{ code='SE'; name='Sergipe' },
  @{ code='TO'; name='Tocantins' }
)
$body = $regions | ConvertTo-Json
$url = $base + '/rest/v1/regions?on_conflict=code'
$resp = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -ContentType 'application/json' -Body $body
Write-Host ('Regiões semeadas: ' + ($resp | Measure-Object).Count)
