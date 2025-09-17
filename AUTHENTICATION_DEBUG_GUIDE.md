# Authentication Debug Guide

## 🔍 **Debug Steps for "Authentication credentials were not provided" Error**

### **Step 1: Open Browser Console**
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Clear any existing logs

### **Step 2: Test Login Process**
1. Navigate to http://localhost:4202/login
2. Enter valid credentials and click login
3. Watch the console for debug messages

### **Expected Console Output:**

#### **For Login Request (should NOT include token):**
```
Auth Interceptor - Request URL: http://localhost:8000/api/auth/login/
Auth Interceptor - Base URL: http://localhost:8000/api  
Auth Interceptor - Token exists: false (or true if old token exists)
Auth Interceptor - URL includes base URL: true
Auth Interceptor - Is auth endpoint: true
Auth Interceptor - NOT adding token. Conditions: URL match = true, Token exists = false, Is auth endpoint = true
```

#### **For Login Response (should store token):**
```
Auth Service - Login response: {access: "your-jwt-token-here", refresh: "...", user: {...}}
Auth Service - Storing token: your-jwt-token-here
```

#### **For Protected Resource Request (should include token):**
```
Auth Interceptor - Request URL: http://localhost:8000/api/users/profile/
Auth Interceptor - Base URL: http://localhost:8000/api
Auth Interceptor - Token exists: true  
Auth Interceptor - URL includes base URL: true
Auth Interceptor - Is auth endpoint: false
Auth Interceptor - Adding Authorization header with token: your-jwt-token-here...
```

### **Step 3: Check Network Tab**
1. Go to Network tab in Developer Tools
2. Look for API requests
3. Click on a protected API request (like `/api/users/profile/`)
4. Check the Request Headers section
5. Verify `Authorization: Bearer your-token-here` is present

### **Step 4: Check localStorage**
1. Go to Application tab (Chrome) or Storage tab (Firefox)
2. Expand localStorage
3. Look for `http://localhost:4202`
4. Verify `token` key exists with a JWT value

## 🚨 **Common Issues and Solutions**

### **Issue 1: Token Not Being Stored**
**Symptoms:** Login seems successful but no token in localStorage
**Debug:** Check login response in Network tab
**Solution:** Backend might not be returning `access` field in response

### **Issue 2: Token Exists But Not Added to Headers**
**Symptoms:** Token in localStorage but Authorization header missing
**Debug:** Check interceptor console logs
**Possible Causes:**
- URL doesn't match `API_CONFIG.BASE_URL`
- Request is classified as auth endpoint incorrectly

### **Issue 3: Wrong URL Format**
**Symptoms:** Django APPEND_SLASH errors
**Debug:** Check actual request URLs in Network tab
**Expected:** All URLs should end with `/` (e.g., `/api/auth/login/`)

### **Issue 4: Interceptor Not Running**
**Symptoms:** No console logs from interceptor
**Solution:** Check `app.config.ts` interceptor registration

## 🛠️ **Manual Testing Commands**

### **Check Token in Console:**
```javascript
// Open browser console and run:
localStorage.getItem('token')
```

### **Test API Call Manually:**
```javascript
// Test authenticated request:
fetch('http://localhost:8000/api/users/profile/', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error(error));
```

## 🎯 **Quick Fixes**

### **If No Token is Stored:**
1. Check backend login endpoint response format
2. Ensure response contains `access` field
3. Check for CORS issues preventing response

### **If Token Exists But Not Sent:**
1. Check URL format (should include trailing slash)
2. Verify `API_CONFIG.BASE_URL` matches request URL
3. Check if request is incorrectly classified as auth endpoint

### **If Token is Invalid:**
1. Check token format (should be JWT)
2. Verify backend accepts `Bearer` tokens
3. Check token expiration

## 🔄 **Remove Debug Logs**
Once authentication is working, remember to remove debug console.log statements from:
- `src/app/shared/interceptors/auth.interceptor.ts`
- `src/app/auth/auth.service.ts`

## 📞 **Still Having Issues?**
If authentication still fails after following this guide:
1. Share the exact console output
2. Share the Network tab request/response details
3. Share the localStorage contents
4. Share the backend Django settings (if accessible)

This will help identify the specific authentication issue! 🎯