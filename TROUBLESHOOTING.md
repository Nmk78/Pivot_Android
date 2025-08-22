# Troubleshooting Guide

This guide helps you resolve common issues with the voice recording and file upload features.

## 🎤 Voice Recording Issues

### Issue: "Microphone permission not granted"
**Solution:**
1. Go to your device settings
2. Find the app in the list
3. Enable microphone permissions
4. Restart the app

### Issue: Recording fails to start
**Solution:**
1. Check if another app is using the microphone
2. Close other audio/video apps
3. Restart the app
4. If using iOS, ensure the device is not in silent mode

### Issue: Audio file not sending to API
**Solution:**
1. Check your internet connection
2. Verify the API server is running
3. Check the API URL in your `.env` file
4. Ensure the API endpoint `/speech` is available

## 📁 File Upload Issues

### Issue: "File type not supported"
**Solution:**
- Only PDF, DOCX, and TXT files are supported
- Check the file extension
- Ensure the file is not corrupted

### Issue: "File size exceeds limit"
**Solution:**
- Maximum file size is 10MB
- Compress or split large files
- Use a smaller document

### Issue: File picker not working
**Solution:**
1. Check file access permissions
2. Ensure you have documents in your device
3. Try restarting the app

## 🌐 Network Issues

### Issue: "Network request failed"
**Common Causes:**
1. **API Server Not Running**
   - Ensure your API server is started
   - Check if it's accessible at the configured URL

2. **CORS Issues (Development)**
   - If using localhost, ensure CORS is configured
   - Add your app's domain to allowed origins

3. **Wrong API URL**
   - Check your `.env` file
   - Verify `EXPO_PUBLIC_API_URL` is correct
   - Ensure the API version is correct

4. **Internet Connection**
   - Check your device's internet connection
   - Try switching between WiFi and mobile data

### Issue: API Health Check Fails
**Solution:**
1. Test the API manually:
   ```bash
   curl https://your-api-url.com/v2/health
   ```
2. Check API server logs
3. Verify the API is responding

## 🔧 Debugging Steps

### 1. Check Environment Variables
Ensure your `.env` file has the correct values:
```env
EXPO_PUBLIC_API_URL=https://your-api-url.com
EXPO_PUBLIC_API_VERSION=v2
```

### 2. Test API Endpoints
Use a tool like Postman or curl to test your API:
```bash
# Test text endpoint
curl -X POST https://your-api-url.com/v2/text \
  -H "Content-Type: application/json" \
  -d '{"query": "Hello"}'

# Test speech endpoint (with a test audio file)
curl -X POST https://your-api-url.com/v2/speech \
  -F "audio_file=@test.wav"
```

### 3. Check Console Logs
Look for these log messages in your app:
- `url🍕🍕` - Shows the API URL being called
- `Request options` - Shows request details
- `Response status` - Shows HTTP status code
- `API Response` - Shows the response data

### 4. Common Error Messages

**"Network request failed"**
- API server is down
- Wrong URL
- CORS issues
- No internet connection

**"API error: 404"**
- Endpoint doesn't exist
- Wrong API version
- Incorrect URL path

**"API error: 500"**
- Server error
- Check API server logs
- Contact API administrator

**"File not found"**
- File was moved or deleted
- Permission issues
- Try selecting the file again

## 🚀 Quick Fixes

### For Development:
1. **Restart everything:**
   ```bash
   # Stop the app
   # Stop the API server
   # Clear cache
   npx expo start --clear
   # Restart API server
   ```

2. **Check API server:**
   ```bash
   # Test if API is running
   curl http://localhost:8000/v2/health
   ```

3. **Reset app permissions:**
   - Delete and reinstall the app
   - Grant permissions again

### For Production:
1. **Check API status:**
   - Verify the API server is running
   - Check server logs for errors
   - Test API endpoints manually

2. **Update environment:**
   - Ensure `.env` has correct production URL
   - Verify API version matches server

3. **Clear app cache:**
   - Clear app data
   - Restart the app

## 📞 Getting Help

If you're still experiencing issues:

1. **Check the logs** - Look for error messages in the console
2. **Test manually** - Try the API endpoints directly
3. **Verify setup** - Ensure all dependencies are installed
4. **Check permissions** - Verify device permissions are granted

### Useful Commands:
```bash
# Check if expo-audio is installed
npm list expo-audio

# Check if expo-document-picker is installed
npm list expo-document-picker

# Clear Metro cache
npx expo start --clear

# Check API health
curl https://your-api-url.com/v2/health
```

## 🔄 Migration from expo-av to expo-audio

If you're seeing deprecation warnings:

1. **Uninstall expo-av:**
   ```bash
   npm uninstall expo-av
   ```

2. **Install expo-audio:**
   ```bash
   npm install expo-audio
   ```

3. **Update imports:**
   - Change `import { Audio } from 'expo-av'` to `import { Audio } from 'expo-audio'`
   - Update `app.json` to use `expo-audio` plugin

4. **Restart the app:**
   ```bash
   npx expo start --clear
   ```
