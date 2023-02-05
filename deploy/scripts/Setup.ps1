###
## Download and install Sysmon
#

$path = "C:\Sysmon"
#Test path and create it if required
If(!(test-path $path))
{
	Write-Information -MessageData "Path does not exist.  Creating Path..." -InformationAction Continue;
	New-Item -ItemType Directory -Force -Path $path | Out-Null;
	Write-Information -MessageData "...Complete" -InformationAction Continue
}
Set-Location $path
Write-Host "Location set $path"
Write-Host "Retrieving Sysmon..."
Invoke-WebRequest -Uri https://download.sysinternals.com/files/Sysmon.zip -Outfile Sysmon.zip
Write-Host "Sysmon Retrived"
Write-Host "Unzip Sysmon..."
Expand-Archive Sysmon.zip
Set-Location $path\Sysmon
Write-Host "Unzip Complete."
Write-Host "Retrieving Configuration File..."
Invoke-WebRequest -Uri https://raw.githubusercontent.com/SwiftOnSecurity/sysmon-config/master/sysmonconfig-export.xml -Outfile sysmonconfig-export.xml
Write-Host "Configuration File Retrieved."
Write-Host "Installing Sysmon..."
.\sysmon64.exe -accepteula -i sysmonconfig-export.xml
Write-Host "Sysmon Installed!"

###
## Enable Better Auditing
#

auditpol /set /subcategory:"Process Creation" /success:Enable
auditpol /set /subcategory:"Logon" /success:Enable /failure:Enable

#regedit.exe C:\deploy\resources\PS_logging.reg

# 4688 command line auditing
#$Key = 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Policies\System\Audit'
#$ValueName = 'ProcessCreationIncludeCmdLine_Enabled'
#$Value = 1
#$Type = 'Dword'
#New-Item –Path $Key –Name $ValueName
#New-ItemProperty -Path $Key -Name $ValueName -Value $Value  -PropertyType $Type

###
## Download and install Invoke-AtomicRedTeam
#

#Write-Host "$('[{0:HH:mm}]' -f (Get-Date)) Downloading Invoke-AtomicRedTeam and atomic tests..."
#If (-not (Test-Path "C:\Tools\AtomicRedTeam")) {
#  Install-PackageProvider -Name NuGet -Force
#  Install-Module -Name powershell-yaml -Force
#  IEX (IWR 'https://raw.githubusercontent.com/redcanaryco/invoke-atomicredteam/master/install-atomicredteam.ps1' -UseBasicParsing);
#  Install-AtomicRedTeam -getAtomics -InstallPath "c:\Tools\AtomicRedTeam"
#  Write-Host "$('[{0:HH:mm}]' -f (Get-Date)) Updating Profile.ps1 to import the Invoke-AtomicRedTeam module..."
#  Add-Content -Path C:\Windows\System32\WindowsPowerShell\v1.0\Profile.ps1 'Import-Module "C:\Tools\AtomicRedTeam\invoke-atomicredteam\Invoke-AtomicRedTeam.psd1" -Force
#$PSDefaultParameterValues = @{"Invoke-AtomicTest:PathToAtomicsFolder"="C:\Tools\AtomicRedTeam\atomics"}' -Force
#} Else {
#  Write-Host "$('[{0:HH:mm}]' -f (Get-Date)) Invoke-AtomicRedTeam was already installed. Moving On."
#}

mkdir C:\deploy\logs