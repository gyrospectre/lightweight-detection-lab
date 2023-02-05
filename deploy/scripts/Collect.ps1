$outpath = ".\Logs"

Get-WinEvent -LogName "Microsoft-Windows-Sysmon/Operational" | Format-Table -Wrap | out-string | Set-Content -Path $outpath"\sysmon.txt"
#Get-WinEvent -ProviderName "Microsoft-Windows-Security-Auditing" | Format-Table -Wrap | out-string | Set-Content -Path $outpath"\security-audit.txt"