# Opens inbound TCP 8081-8095 on Private/Domain profiles so Expo Go can reach Metro (Windows Firewall).
# Re-launches elevated if needed (UAC prompt).

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator
)

if (-not $isAdmin) {
  Write-Host "[expo-firewall] Requesting Administrator permission..."
  Start-Process powershell.exe -Verb RunAs -ArgumentList @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', $PSCommandPath
  )
  exit 0
}

$ruleName = 'Expo Metro (8081-8095) Inbound TCP'
$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "[expo-firewall] Rule already exists: $ruleName"
  exit 0
}

New-NetFirewallRule -DisplayName $ruleName `
  -Direction Inbound `
  -Action Allow `
  -Protocol TCP `
  -LocalPort 8081-8095 `
  -Profile Private,Domain,Public `
  -Description 'Allows Expo Go / simulators to load JS from Metro on your LAN.' | Out-Null

Write-Host "[expo-firewall] Created firewall rule: $ruleName (all network location profiles)."
exit 0
