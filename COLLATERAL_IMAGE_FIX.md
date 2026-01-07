# Collateral Image Handling Fix

## Problem
Collateral images were being stored as temporary blob URLs that expire and can't be retrieved later.

## Solution
The backend now has a dedicated endpoint to serve collateral images properly.

## Frontend Changes Required

When uploading a collateral image, convert the File/Blob to Base64 before sending:

```javascript
// In your image upload handler
const file = e.target.files[0];
const reader = new FileReader();

reader.onload = function(event) {
  // This gives you the base64 data URL
  const base64Image = event.target.result;
  
  // Send this to the server instead of blob URL
  const formData = {
    // ... other form data ...
    collateralImage: base64Image // Now it's permanent
  };
};

reader.readAsDataURL(file);
```

## Backend Changes - Already Done ✅

1. Added new endpoint: `GET /customers/:customerId/loans/:loanId/collateral-image`
2. This endpoint retrieves the stored collateral image from the database
3. Returns the image in a retrievable format

## API Usage

### Retrieve Collateral Image
```bash
GET /customers/:customerId/loans/:loanId/collateral-image

Response:
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..." 
}
```

### Save Collateral Image
When creating/updating a loan, send the image as base64 data URL:
```javascript
{
  "collateralImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

## Frontend Display

```jsx
// To display the image
<img 
  src={collateralImageData} 
  alt="Collateral" 
  style={{width: '100%', maxHeight: '300px'}}
/>

// OR fetch it from the endpoint
<img 
  src="/api/customers/1/loans/5/collateral-image" 
  alt="Collateral"
/>
```

## Why This Works
- Base64 data URLs are permanent and don't expire
- Blob URLs are temporary and only exist in the current browser session
- Storing base64 in the database ensures images persist across sessions
- The dedicated endpoint allows retrieving images anytime

## Migration for Existing Loans
Existing loans with blob URLs won't display correctly until:
1. The user re-uploads the collateral image (which will save it as base64)
2. Or a migration script converts existing blob references to actual image data

## Implementation Checklist
- [ ] Update frontend image upload handlers to use FileReader.readAsDataURL()
- [ ] Update loan creation form to send base64 images
- [ ] Update loan payment/editing to handle images properly
- [ ] Test image upload and retrieval workflow
- [ ] Verify images persist after page refresh
