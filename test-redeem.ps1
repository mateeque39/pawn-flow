#!/usr/bin/env pwsh

# Wait for server
Start-Sleep -Seconds 2

# Test creating and redeeming a loan
$customerId = 3
$loanBody = @{
    loanAmount = 50
    interestRate = 5
    userId = 1
} | ConvertTo-Json

Write-Host "Creating loan..."
$loanResp = Invoke-RestMethod -Uri "http://localhost:5000/customers/$customerId/loans" `
    -Method POST -ContentType "application/json" -Body $loanBody

$loanId = $loanResp.loan.id
$totalPayable = $loanResp.loan.total_payable_amount

Write-Host "Loan ID: $loanId"
Write-Host "Total Payable: $totalPayable"

# Pay full amount
Write-Host "`nMaking payment of $totalPayable..."
$paymentBody = @{
    paymentAmount = [decimal]$totalPayable
    userId = 1
} | ConvertTo-Json

$paymentResp = Invoke-RestMethod -Uri "http://localhost:5000/customers/$customerId/loans/$loanId/payment" `
    -Method POST -ContentType "application/json" -Body $paymentBody

Write-Host "Payment message: $($paymentResp.message)"
Write-Host "Remaining balance: $($paymentResp.loan.remaining_balance)"

# Now redeem
Write-Host "`nAttempting redemption..."
$redeemBody = @{ userId = 1 } | ConvertTo-Json

$redeemResp = Invoke-RestMethod -Uri "http://localhost:5000/customers/$customerId/loans/$loanId/redeem" `
    -Method POST -ContentType "application/json" -Body $redeemBody

Write-Host "Redeem message: $($redeemResp.message)"
Write-Host "Loan status: $($redeemResp.loan.status)"
Write-Host "`n✓ Test completed successfully!"
