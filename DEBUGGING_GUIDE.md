# 🔧 ClimbMeter Pro - Debugging Guide

## Quick Start Testing

### **1. Deploy to GitHub Pages**

```bash
# In your repo:
git add climbmeter-clean.html manifest.json
git mv climbmeter-clean.html index.html  # IMPORTANT: Must be named index.html
git commit -m "Clean version ready for testing"
git push
```

Then: `https://jorritgru.github.io/climbmeter/`

---

## **2. Test on Your Phone**

### **A. Basic Connectivity Test**

1. **Open app in Chrome** (Android)
2. **Tap "Connect Device"**
3. **What should happen:**
   - Bluetooth pairing dialog appears
   - Your device shows up in the list
   - (WH-C300T or similar name)

**✅ SUCCESS:** Dialog appears  
**❌ FAIL:** No dialog → Check browser (must be Chrome)

---

### **B. Connection Test**

1. **Select your device** from pairing dialog
2. **What should happen:**
   - "Connecting..." loading screen
   - After 1-2 seconds: "Connected successfully!"
   - Status changes to "Connected" (green dot)
   - Device name shows in Settings tab

**✅ SUCCESS:** Connected  
**❌ FAIL:** Connection error → Check console (F12)

---

### **C. Data Flow Test**

1. **After connecting**, watch the Live tab
2. **Pull on your device**
3. **What should happen:**
   - Numbers change in real-time
   - Current Force updates (~10-80 Hz)
   - Peak Force increases when you pull

**✅ SUCCESS:** Numbers change when pulling  
**❌ FAIL:** Numbers stay at 0.0 → Data format issue

---

## **3. Console Debugging**

### **Open Chrome DevTools:**
- **Android:** Chrome → ⋮ menu → "Remote devices" (on PC)
- **PC:** F12 or Ctrl+Shift+I

### **What to Look For:**

```javascript
// GOOD SIGNS:
✅ ClimbMeter Pro initialized
✅ GATT server connected
✅ Custom device detected
✅ Command characteristic available

// BAD SIGNS (and fixes):
❌ Connection error: NotFoundError
   → Device not in range / Bluetooth off

❌ Connection error: NetworkError
   → Service UUID mismatch
   → Check your device's UUID

❌ Connection error: SecurityError
   → HTTPS required (GitHub Pages is HTTPS ✓)

❌ Data not updating
   → Check: handleCustomData() being called?
   → Check: Data format matches your device?
```

---

## **4. Device-Specific Debugging**

### **Your Hardware: WH-C300T + HX711 + TTGO**

**Expected BLE Service UUID:**
```
Service: 6e400001-b5a3-f393-e0a9-e50e24dcca9e
Data:    6e400002-b5a3-f393-e0a9-e50e24dcca9e
Command: 6e400003-b5a3-f393-e0a9-e50e24dcca9e
```

**If your device uses different UUIDs:**

1. **Find your UUIDs:**
   - Use "nRF Connect" app (Android/iOS)
   - Scan for your device
   - View services and characteristics
   - Note down the UUIDs

2. **Update the code:**
```javascript
// In climbmeter-clean.html, find:
const BLE_CONFIG = {
    CUSTOM_SERVICE: 'YOUR-SERVICE-UUID-HERE',
    CUSTOM_DATA: 'YOUR-DATA-UUID-HERE',
    CUSTOM_COMMAND: 'YOUR-COMMAND-UUID-HERE',
    // ...
};
```

---

### **Data Format Check**

**Your device sends:** (probably)
- 4 bytes: Force as float (little-endian)
- Optional 4 bytes: Battery voltage as float

**If numbers are wrong:**

```javascript
// Try different parsing in handleCustomData():

// Option 1: Float32 (current)
const force = data.getFloat32(0, true);

// Option 2: Int16 (like Tindeq)
const force = data.getInt16(0, true) * 0.1;

// Option 3: Int32
const force = data.getInt32(0, true) / 100;

// Option 4: Big-endian
const force = data.getFloat32(0, false);
```

**To test:**
1. Add console.log in `handleCustomData()`:
```javascript
function handleCustomData(event) {
    const value = event.target.value;
    const data = new DataView(value.buffer);
    
    console.log('Raw bytes:', new Uint8Array(value.buffer));
    console.log('Byte length:', data.byteLength);
    console.log('Parsed force:', force);
    
    // ... rest of function
}
```

2. Pull on device
3. Check console output
4. Adjust parsing based on what you see

---

## **5. Common Issues & Fixes**

### **Issue: "Connect Device" does nothing**

**Check:**
1. Browser supports Bluetooth? (Chrome only)
2. HTTPS? (GitHub Pages = yes ✓)
3. Console errors?

**Fix:**
- Use Chrome browser
- Check for JavaScript errors in console
- Try on different device

---

### **Issue: Connection fails immediately**

**Check:**
1. Device powered on?
2. Device in range?
3. Device already connected to another app?

**Fix:**
- Turn device off/on
- Close other Bluetooth apps
- Forget device in system settings, reconnect

---

### **Issue: Connected but no data**

**Check:**
1. Is `handleCustomData()` being called?
   - Add: `console.log('Data received!');` in function
2. Data format correct?
   - Add: `console.log('Raw bytes:', new Uint8Array(value.buffer));`

**Fix:**
- Check firmware is sending data
- Verify data format matches parsing code
- Try different parsing methods (above)

---

### **Issue: Numbers are wrong**

**Symptoms:**
- Force shows 1000x too high
- Negative numbers
- Random garbage

**Fixes:**
```javascript
// Too high? Wrong unit conversion
const force = data.getFloat32(0, true) / 1000; // If in grams

// Negative? Wrong byte order
const force = data.getFloat32(0, false); // Try big-endian

// Garbage? Wrong data type
const force = data.getInt16(0, true) * 0.1; // Try int instead of float
```

---

### **Issue: Audio doesn't work**

**Check:**
1. Audio enabled in Settings?
2. Phone volume up?
3. Browser permissions?

**Fix:**
- Toggle audio in Settings tab
- Check phone's media volume (not ringer)
- Try saying something to force audio permission

---

### **Issue: App crashes**

**Check Console:**
```javascript
// Look for:
❌ Uncaught TypeError
❌ Uncaught ReferenceError
❌ Maximum call stack exceeded
```

**Common Causes:**
1. Infinite loop in data handler
2. Memory leak in force history
3. Missing null checks

**Quick Fix:**
- Reload page
- Clear browser cache
- Check console for exact error

---

## **6. Testing Checklist**

### **Phase 1: Connection ✓**
- [ ] App loads without errors
- [ ] "Connect Device" shows pairing dialog
- [ ] Device appears in list
- [ ] Connection succeeds
- [ ] Status shows "Connected"
- [ ] Device name appears in Settings

### **Phase 2: Live Data ✓**
- [ ] Current Force updates when pulling
- [ ] Peak Force increases correctly
- [ ] RFD shows (may be 0 when static)
- [ ] Battery percentage shows (if available)
- [ ] Numbers are reasonable (not 1000x off)

### **Phase 3: Commands ✓**
- [ ] "Reset Peak" resets peak to 0.0
- [ ] "Tare" zeros the device
- [ ] No errors in console

### **Phase 4: Tests ✓**
- [ ] Can start Peak Force test
- [ ] Test countdown works
- [ ] Timer counts down
- [ ] Audio cues play
- [ ] Test completes and saves
- [ ] Results show correctly

### **Phase 5: History ✓**
- [ ] Completed tests appear in History
- [ ] Export CSV works
- [ ] Sessions persist after reload

### **Phase 6: Settings ✓**
- [ ] Body weight can be changed
- [ ] Audio toggle works
- [ ] Haptic toggle works
- [ ] Stats update correctly
- [ ] Settings persist after reload

---

## **7. Performance Testing**

### **Test Data Rate:**

```javascript
// Add to handleCustomData():
let dataCount = 0;
let lastLog = Date.now();

function handleCustomData(event) {
    dataCount++;
    
    if (Date.now() - lastLog > 1000) {
        console.log('Data rate:', dataCount, 'Hz');
        dataCount = 0;
        lastLog = Date.now();
    }
    
    // ... rest of function
}
```

**Expected:** 10-80 Hz (depends on your device)

---

### **Test Latency:**

1. Pull on device quickly
2. Watch Live tab numbers
3. Should update immediately (<100ms delay)

**If laggy:**
- Too much processing in data handler
- Too many console.log() statements
- Browser performance issues

---

## **8. Next Steps After Basic Testing**

### **Once connected and working:**

1. **Test all test modes**
   - Peak Force (3 attempts)
   - Endurance (30s hold)
   - Repeaters (6×7s)
   - RFD (5 attempts)
   - Critical Force (3 minutes)

2. **Test target zones**
   - Set target in Endurance test
   - Pull to target
   - Verify zone indicator works
   - Check "IN ZONE" status

3. **Test auto-start**
   - Enable in Settings
   - Pull on device
   - Should say "Start"
   - Release → should say "Rest"

4. **Test hand modes**
   - Set test to "Left Hand Only"
   - Set test to "Alternate"
   - Verify voice cues work

5. **Stress test**
   - Run 10+ tests
   - Check for memory leaks
   - Verify no crashes
   - Check performance stays good

---

## **9. Known Limitations**

**Current Version:**
- ✅ Connection: Works
- ✅ Live data: Works
- ✅ Tests: Works
- ✅ History: Works
- ✅ Settings: Works
- ⚠️ Tare: May not work (device dependent)
- ⚠️ Battery: May not work (device dependent)
- ⚠️ Tindeq: Not tested with real device

**To Be Added:**
- Visual force graph (real-time chart)
- Left/Right hand detailed tracking
- Normative data comparison
- Warmup protocols
- Custom routine builder

---

## **10. Reporting Issues**

**When reporting bugs, include:**

1. **Device info:**
   - Phone model
   - Chrome version
   - Android/iOS version

2. **Connection info:**
   - Device name
   - UUIDs (if known)
   - Error message (exact text)

3. **Console output:**
   - F12 → Console tab
   - Copy all red errors
   - Screenshot if helpful

4. **Steps to reproduce:**
   - What you did
   - What happened
   - What you expected

---

## **11. Quick Fixes**

### **"Nothing works!"**
```bash
# Nuclear option:
1. Clear browser cache
2. Hard refresh: Ctrl+Shift+R
3. Close all tabs
4. Restart browser
5. Try again
```

### **"It was working, now it's not!"**
```bash
# Reset everything:
1. Settings → Clear All History
2. Clear browser cache
3. Disconnect device
4. Turn device off/on
5. Reconnect
```

### **"Numbers are crazy!"**
```javascript
// Add safety limits:
function updateForce(force) {
    // Clamp to reasonable range
    force = Math.max(0, Math.min(200, force));
    
    // Ignore tiny fluctuations
    if (Math.abs(force - STATE.currentForce) < 0.1) {
        return;
    }
    
    STATE.currentForce = force;
    // ... rest
}
```

---

## **12. Success Criteria**

**Your app is working when:**

✅ Connects in <3 seconds  
✅ Numbers update smoothly  
✅ No crashes after 10 tests  
✅ Tests complete successfully  
✅ History saves and loads  
✅ Audio cues work  
✅ Vibration works  

**If all these work → READY TO USE!** 🎉

---

## **Need Help?**

1. **Check console first** (F12)
2. **Read error messages carefully**
3. **Try the "Quick Fixes" above**
4. **Note exactly what's not working**
5. **Then ask for help with details**

**Good luck!** 🚀🧗
