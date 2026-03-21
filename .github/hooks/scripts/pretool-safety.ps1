$ErrorActionPreference = 'Stop'

function Get-InputText {
    try {
        return [Console]::In.ReadToEnd()
    }
    catch {
        return ""
    }
}

function Out-Allow {
    $obj = @{
        hookSpecificOutput = @{
            hookEventName = 'PreToolUse'
            permissionDecision = 'allow'
            permissionDecisionReason = 'No high-risk pattern detected.'
        }
    }
    $obj | ConvertTo-Json -Depth 10 -Compress
}

function Out-Ask([string]$reason) {
    $obj = @{
        hookSpecificOutput = @{
            hookEventName = 'PreToolUse'
            permissionDecision = 'ask'
            permissionDecisionReason = $reason
        }
    }
    $obj | ConvertTo-Json -Depth 10 -Compress
}

function Find-StringValue {
    param(
        [Parameter(Mandatory = $true)]
        $Node,
        [Parameter(Mandatory = $true)]
        [string]$TargetKey
    )

    if ($null -eq $Node) { return $null }

    if ($Node -is [System.Collections.IDictionary]) {
        foreach ($k in $Node.Keys) {
            if ($k -eq $TargetKey -and $Node[$k] -is [string]) {
                return $Node[$k]
            }
            $result = Find-StringValue -Node $Node[$k] -TargetKey $TargetKey
            if ($result) { return $result }
        }
    }
    elseif ($Node -is [System.Collections.IEnumerable] -and -not ($Node -is [string])) {
        foreach ($item in $Node) {
            $result = Find-StringValue -Node $item -TargetKey $TargetKey
            if ($result) { return $result }
        }
    }

    return $null
}

$inputText = Get-InputText
if ([string]::IsNullOrWhiteSpace($inputText)) {
    Out-Allow
    exit 0
}

try {
    $payload = $inputText | ConvertFrom-Json -Depth 50
}
catch {
    Out-Allow
    exit 0
}

$toolName = Find-StringValue -Node $payload -TargetKey 'toolName'
$commandText = Find-StringValue -Node $payload -TargetKey 'command'

if (-not $commandText -or $commandText.Trim().Length -eq 0) {
    Out-Allow
    exit 0
}

$dangerPatterns = @(
    '(^|\s)rm\s+-rf\s+(/|\.|\w)'
    'Remove-Item\s+.+-Recurse\s+.+-Force'
    'git\s+reset\s+--hard'
    'git\s+clean\s+-fdx'
    'drop\s+database'
    'db\.dropDatabase\('
)

foreach ($pattern in $dangerPatterns) {
    if ($commandText -match $pattern) {
        $reason = "Potentially destructive command detected for tool '$toolName': $commandText"
        Out-Ask -reason $reason
        exit 0
    }
}

Out-Allow
exit 0
