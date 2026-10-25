param([string]$OutputDirectory = (Join-Path $PSScriptRoot '..\sets'))
$ErrorActionPreference = 'Stop'
$LF = [string][char]10
$TAB = [string][char]9
$unicodeVersion = '17.0.0'
$unicodeDataUrl = "https://www.unicode.org/Public/$unicodeVersion/ucd/DerivedAge.txt"
$unihanUrl = "https://www.unicode.org/Public/$unicodeVersion/ucd/Unihan.zip"
$client = [System.Net.Http.HttpClient]::new()
try {
  $ageBytes = $client.GetByteArrayAsync($unicodeDataUrl).GetAwaiter().GetResult()
  $ageText = [System.Text.Encoding]::UTF8.GetString($ageBytes)
  $coreMap = [System.Collections.Generic.SortedDictionary[int,string]]::new()
  foreach ($line in ($ageText -split $LF)) {
    $body = ($line -split '#')[0].Trim()
    if (!$body) { continue }
    $fields = $body -split ';'
    if ($fields.Length -lt 2) { continue }
    $range = $fields[0].Trim().Split('..')
    $lo = [Convert]::ToInt32($range[0], 16)
    $hi = if ($range.Length -gt 1) { [Convert]::ToInt32($range[1], 16) } else { $lo }
    $from = [Math]::Max($lo, 0x4E00)
    $to = [Math]::Min($hi, 0x9FFF)
    for ($cp = $from; $cp -le $to; $cp++) { $coreMap[$cp] = [char]$cp }
  }
  $core = @($coreMap.Values)
  $zipBytes = $client.GetByteArrayAsync($unihanUrl).GetAwaiter().GetResult()
  $stream = [System.IO.MemoryStream]::new($zipBytes)
  $zip = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Read, $false)
  try {
    $entry = $zip.GetEntry('Unihan_OtherMappings.txt')
    if (!$entry) { throw 'Unihan_OtherMappings.txt missing from pinned archive.' }
    $reader = [System.IO.StreamReader]::new($entry.Open(), [System.Text.Encoding]::UTF8, $true)
    try {
      $rankMap = @{}
      while (($line = $reader.ReadLine()) -ne $null) {
        if ($line.StartsWith('#')) { continue }
        $fields = $line -split $TAB
        if ($fields.Length -lt 3 -or $fields[1] -ne 'kTGH') { continue }
        if ($fields[2] -match '^2013:(\d+)$') {
          $rank = [int]$Matches[1]
          if ($rank -ge 1 -and $rank -le 3500) { $rankMap[$rank] = [string][char][Convert]::ToInt32($fields[0].Substring(2), 16) }
        }
      }
    } finally { $reader.Dispose() }
    $common = @()
    for ($rank = 1; $rank -le 3500; $rank++) {
      if (!$rankMap.ContainsKey($rank)) { throw "Missing kTGH 2013 rank $rank." }
      $common += $rankMap[$rank]
    }
  } finally { $zip.Dispose(); $stream.Dispose() }
  if ($core.Count -ne 20992) { throw "Unicode 17.0 URO expected 20992 assigned code points, got $($core.Count)." }
  if ($rankMap.Count -ne 3500 -or @($common | Sort-Object -Unique).Count -ne 3500) { throw 'TGH level 1 must contain 3500 unique characters.' }
  $coreSet = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
  foreach ($char in $core) { [void]$coreSet.Add($char) }
  if (@($common | Where-Object { !$coreSet.Contains($_) }).Count) { throw 'TGH level 1 is not a subset of the URO core set.' }
  [void](New-Item -ItemType Directory -Force -Path $OutputDirectory)
  $enc = [System.Text.UTF8Encoding]::new($false)
  $corePath = Join-Path $OutputDirectory 'unicode17-core-u4e00-9fff.txt'
  $commonPath = Join-Path $OutputDirectory 'unicode17-common3500-kTGH.txt'
  $coreBytes = [System.Text.Encoding]::UTF8.GetBytes(($core -join $LF) + $LF)
  $commonBytes = [System.Text.Encoding]::UTF8.GetBytes(($common -join $LF) + $LF)
  [System.IO.File]::WriteAllBytes($corePath, $coreBytes)
  [System.IO.File]::WriteAllBytes($commonPath, $commonBytes)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    $manifest = [ordered]@{
      schemaVersion = 1
      unicodeVersion = $unicodeVersion
      generatedAt = (Get-Date -Format 'yyyy-MM-dd')
      core = [ordered]@{
        source = 'DerivedAge.txt'; url = $unicodeDataUrl; range = 'U+4E00..U+9FFF'; assigned = $core.Count
        sourceSha256 = [Convert]::ToHexString($sha.ComputeHash($ageBytes)).ToLowerInvariant()
        fixture = 'unicode17-core-u4e00-9fff.txt'
        fixtureSha256 = [Convert]::ToHexString($sha.ComputeHash($coreBytes)).ToLowerInvariant()
      }
      common3500 = [ordered]@{
        source = 'Unihan kTGH 2013 ranks 1..3500'; url = $unihanUrl; archiveEntry = 'Unihan_OtherMappings.txt'; count = $common.Count
        sourceArchiveSha256 = [Convert]::ToHexString($sha.ComputeHash($zipBytes)).ToLowerInvariant()
        fixture = 'unicode17-common3500-kTGH.txt'
        fixtureSha256 = [Convert]::ToHexString($sha.ComputeHash($commonBytes)).ToLowerInvariant()
      }
      checks = [ordered]@{ sourceRanks = $rankMap.Count; coreFixtureUnique = $core.Count; commonFixtureUnique = 3500; commonSetMatchesSource = $true; commonSubsetOfCore = $true }
    }
    [System.IO.File]::WriteAllText((Join-Path $OutputDirectory 'source-manifest.json'), ($manifest | ConvertTo-Json -Depth 8), $enc)
    Write-Output "Wrote $($core.Count) Unicode 17.0 core cases and $($common.Count) TGH level-1 cases."
    Write-Output "DerivedAge SHA-256: $($manifest.core.sourceSha256)"
    Write-Output "Unihan.zip SHA-256: $($manifest.common3500.sourceArchiveSha256)"
  } finally { $sha.Dispose() }
} finally { $client.Dispose() }