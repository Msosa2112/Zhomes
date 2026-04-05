$h = @{
    'Authorization' = 'Bearer 6ojczz7todkepnsvryhw7m8ka'
    'X-SparkApi-User-Agent' = 'ZhomesApp/1.0'
}

$select = "ListingKey,ListingId,UnparsedAddress,City,ListPrice,OriginalListPrice,PreviousListPrice,StandardStatus,MlsStatus,DaysOnMarket,SpecialListingConditions,PublicRemarks,PrivateRemarks,ListAgentFullName,ListOfficeName,YearBuilt,LivingArea,BedroomsTotal,BathroomsTotalInteger,PriceChangeTimestamp,TaxAnnualAmount"
$baseUrl = "https://replication.sparkapi.com/Version/3/Reso/OData/Property?`$select=$select&`$top=200"

$nextUrl = $baseUrl
$page = 0
$found = $false

while ($nextUrl -and -not $found -and $page -lt 50) {
    try {
        $r = Invoke-RestMethod -Uri $nextUrl -Headers $h -Method GET
        $page++
        
        $match = $r.value | Where-Object { 
            $_.ListingId -eq '1712956' -or $_.UnparsedAddress -like '*Scholar*' 
        }
        
        if ($match) {
            Write-Host "`n✅ FOUND on page $page!" -ForegroundColor Green
            $match | ConvertTo-Json -Depth 5
            $found = $true
        } else {
            Write-Host "Page $page`: $($r.value.Count) listings scanned... (sample: $($r.value[0].UnparsedAddress))"
            $nextUrl = $r.'@odata.nextLink'
            if (-not $nextUrl) {
                Write-Host "No more pages. Total pages scanned: $page"
            }
        }
    } catch {
        Write-Host "Error on page $page`: $($_.Exception.Message)"
        break
    }
}

if (-not $found) {
    Write-Host "`n❌ Property 1712956 / Scholar St not found in $page pages ($(200*$page) listings)"
}
