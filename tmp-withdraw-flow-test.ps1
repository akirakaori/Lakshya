$ErrorActionPreference='Stop'
$base='http://localhost:3000/api'
$ts=[DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$recruiterEmail="recruiter.$ts@test.com"
$seekerEmail="seeker.$ts@test.com"
$password='test1234'
$numSuffix = ($ts % 100000000).ToString('D8')
$recruiterNumber = "98$numSuffix"
$seekerNumber = "97$numSuffix"

function PostJson($url,$body,$headers){
  $json=$body|ConvertTo-Json -Depth 10
  if($headers){ return Invoke-RestMethod -Method Post -Uri $url -Headers $headers -ContentType 'application/json' -Body $json }
  return Invoke-RestMethod -Method Post -Uri $url -ContentType 'application/json' -Body $json
}
function PatchJson($url,$body,$headers){
  $json=$body|ConvertTo-Json -Depth 10
  return Invoke-RestMethod -Method Patch -Uri $url -Headers $headers -ContentType 'application/json' -Body $json
}

$rReg=PostJson "$base/auth/register" @{name='Recruiter Test';email=$recruiterEmail;password=$password;number=$recruiterNumber;role='recruiter';companyName='TestCo';location='Kathmandu'} $null
$sReg=PostJson "$base/auth/register" @{name='Seeker Test';email=$seekerEmail;password=$password;number=$seekerNumber;role='job_seeker'} $null

$rLogin=PostJson "$base/auth/login" @{email=$recruiterEmail;password=$password} $null
$sLogin=PostJson "$base/auth/login" @{email=$seekerEmail;password=$password} $null
$rHeaders=@{Authorization="Bearer $($rLogin.jwtToken)"}
$sHeaders=@{Authorization="Bearer $($sLogin.jwtToken)"}

$job=PostJson "$base/jobs" @{title='Withdraw Flow QA';description='Test job for withdraw lifecycle';companyName='TestCo';location='Kathmandu';jobType='Full-time';remoteType='Onsite'} $rHeaders
$jobId=$job.data._id

$apply1=PostJson "$base/applications/$jobId" @{coverLetter='first apply'} $sHeaders
$appId1=$apply1.data._id

$shortlist=PatchJson "$base/recruiter/applications/$appId1/status" @{status='shortlisted'} $rHeaders
$withdraw=Invoke-RestMethod -Method Delete -Uri "$base/applications/$appId1/withdraw" -Headers $sHeaders

$blockedStatusCode=$null
$blockedBody=$null
try {
  $null=PatchJson "$base/recruiter/applications/$appId1/status" @{status='rejected'} $rHeaders
  $blockedBody='UNEXPECTED_SUCCESS'
} catch {
  $blockedStatusCode=[int]$_.Exception.Response.StatusCode
  $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
  $blockedBody = $reader.ReadToEnd()
}

$apply2=PostJson "$base/applications/$jobId" @{coverLetter='reapply'} $sHeaders
$appId2=$apply2.data._id

$myApps=Invoke-RestMethod -Method Get -Uri "$base/applications/my?limit=50" -Headers $sHeaders
$myApp=($myApps.data | Where-Object { $_.jobId -and $_.jobId._id -eq $jobId } | Select-Object -First 1)

$result=[PSCustomObject]@{
  recruiterEmail=$recruiterEmail
  seekerEmail=$seekerEmail
  jobId=$jobId
  firstApplicationId=$appId1
  secondApplicationId=$appId2
  sameApplicationReused=($appId1 -eq $appId2)
  recruiterBlockedStatusCode=$blockedStatusCode
  recruiterBlockedBody=$blockedBody
  finalStatus=$myApp.status
  finalIsWithdrawn=$myApp.isWithdrawn
  finalWithdrawnAt=$myApp.withdrawnAt
}

$result | ConvertTo-Json -Depth 10
