# Google Search Console Setup Guide - BAESS Labs

## 🎯 What is Google Search Console?

Google Search Console (GSC) is a **free tool** from Google that helps you:
- Monitor your website's presence in Google Search results
- See which keywords bring traffic to your site
- Identify and fix indexing issues
- Submit sitemaps for faster indexing
- Track click-through rates (CTR)
- Monitor mobile usability
- Detect security issues

**Why it's critical:** Without GSC, you're flying blind. It's the **#1 SEO tool** you need.

---

## 📋 Step-by-Step Setup Guide

### **Step 1: Access Google Search Console**

1. **Go to:** https://search.google.com/search-console/
2. **Sign in** with your Google account (use your BAESS Labs business email if possible)
3. **Click** "Start Now" or "Add Property"

**Time:** 1 minute

---

### **Step 2: Add Your Property**

You'll see two options:

#### **Option A: Domain Property (Recommended)**
✅ Tracks all versions (http, https, www, non-www)
✅ More comprehensive

**Choose this!**

1. Select **"Domain"** on the left
2. Enter: `baess.app` (without https://)
3. Click **"Continue"**

#### **Option B: URL Prefix**
❌ Only tracks specific URL version
❌ Need separate properties for www vs non-www

**Skip this for now**

**Time:** 30 seconds

---

### **Step 3: Verify Ownership (DNS Method - Recommended)**

Google will show you a **TXT record** to add to your DNS.

**Example:**
```
TXT record: google-site-verification=AbCdEf123456789...
```

#### **How to Add DNS Record:**

**For Spaceship.com (Your Domain Provider):**

1. **Log in** to your Spaceship.com account
2. Go to **Domains** → **baess.app**
3. Click **"DNS Settings"** or **"Manage DNS"**
4. Click **"Add Record"** or **"Add DNS Record"**
5. Fill in:
   ```
   Type: TXT
   Host: @ (or leave blank)
   Value: [paste the verification code from Google]
   TTL: 3600 (or leave default)
   ```
6. Click **"Save"** or **"Add Record"**
7. **Wait 5-10 minutes** for DNS propagation

#### **Back in Google Search Console:**

8. Click **"Verify"**
9. If successful, you'll see: **"Ownership verified"** ✅

**If verification fails:**
- Wait 15-30 more minutes (DNS can be slow)
- Check you copied the TXT record exactly
- Make sure there are no extra spaces
- Try again

**Time:** 5-15 minutes (including DNS wait)

---

### **Step 4: Set Preferred Domain (Optional)**

1. In GSC, go to **Settings** (gear icon)
2. Under **"Property settings"**
3. Set preferred domain to: `https://www.baess.app` or `https://baess.app`

**Recommendation:** Choose `https://www.baess.app` (with www) for consistency

**Time:** 1 minute

---

### **Step 5: Submit Your Sitemap**

This is **CRITICAL** for fast indexing!

1. In Google Search Console sidebar, go to **"Sitemaps"**
2. In the "Add a new sitemap" field, enter: `sitemap.xml`
3. Click **"Submit"**
4. You should see: **"Success"** ✅

**What this does:**
- Tells Google about all your pages
- Speeds up indexing (days instead of weeks)
- Helps Google understand your site structure

**Time:** 30 seconds

---

### **Step 6: Request Indexing for Key Pages**

Speed up indexing for your most important pages:

1. In GSC sidebar, go to **"URL Inspection"**
2. Enter your homepage URL: `https://baess.app/`
3. Click **"Test Live URL"**
4. If not indexed yet, click **"Request Indexing"**
5. Repeat for key pages:
   - `https://baess.app/pv-designer`
   - `https://baess.app/bess-designer`
   - `https://baess.app/blog`
   - `https://baess.app/documentation`

**Limit:** Google allows ~10 manual indexing requests per day

**Time:** 5 minutes

---

### **Step 7: Enable Email Notifications**

Get alerts for issues:

1. Go to **Settings** (gear icon)
2. Click **"Users and permissions"**
3. Make sure your email has **"Owner"** permission
4. Go to **Settings** → **"Email notifications"**
5. Enable:
   - ✅ Search Console message
   - ✅ Site issues
   - ✅ Manual actions (penalties)
   - ✅ Core Web Vitals
   - ✅ Rich results

**Time:** 2 minutes

---

### **Step 8: Set Up Integration with Google Analytics (Optional but Recommended)**

Link GSC with Google Analytics 4:

1. In GSC, go to **Settings**
2. Click **"Associations"**
3. Click **"Associate"**
4. Select your Google Analytics property
5. Confirm

**Benefit:** See search data in Google Analytics

**Time:** 2 minutes

---

## ✅ Verification Checklist

After setup, verify everything is working:

- [ ] Property verified (green checkmark)
- [ ] Sitemap submitted and shows "Success"
- [ ] At least 1 URL indexed
- [ ] Email notifications enabled
- [ ] Mobile usability checked (no errors)
- [ ] Core Web Vitals report accessible

---

## 📊 What to Do After Setup

### **Week 1: Monitor Initial Data**

Check daily:
- **Coverage** → How many pages are indexed?
- **Performance** → Any traffic yet?
- **Enhancements** → Any errors?

### **Week 2-4: Regular Monitoring**

Check 2-3x per week:
- **Performance** → Track impressions, clicks, CTR
- **Coverage** → Ensure all pages indexed
- **Mobile Usability** → Fix any mobile issues
- **Core Web Vitals** → Ensure good scores

### **Monthly: Deep Analysis**

- **Top queries** → What keywords bring traffic?
- **Top pages** → What content performs best?
- **Search appearance** → Are rich snippets showing?
- **Links** → Who's linking to you?

---

## 🎯 Key Metrics to Track

### **Impressions**
How many times your site appeared in search results
**Goal Month 1:** 1,000+
**Goal Month 3:** 10,000+

### **Clicks**
How many people clicked from search results
**Goal Month 1:** 50+
**Goal Month 3:** 500+

### **CTR (Click-Through Rate)**
Clicks ÷ Impressions × 100
**Goal:** 3-5% average (varies by position)

### **Average Position**
Where you rank on average
**Goal Month 1:** Position 20-30
**Goal Month 3:** Position 10-15
**Goal Month 6:** Position 3-5 for key terms

---

## 🚨 Common Issues & Fixes

### **Issue: "Coverage errors found"**

**Fix:**
1. Go to **Coverage** report
2. Click on the error type
3. Review affected URLs
4. Fix the issue (usually 404s or redirect loops)
5. Click **"Validate Fix"**

### **Issue: "Sitemap couldn't be read"**

**Fix:**
1. Check sitemap URL: `https://baess.app/sitemap.xml`
2. Make sure file exists in `public/` folder
3. Verify XML is valid (no syntax errors)
4. Resubmit sitemap

### **Issue: "Page is not mobile-friendly"**

**Fix:**
1. Test page at: https://search.google.com/test/mobile-friendly
2. Fix identified issues (usually viewport or touch targets)
3. Request re-crawl

### **Issue: "Soft 404 error"**

**Fix:**
1. Page returns 200 but has no content
2. Add substantial content (500+ words)
3. Or return proper 404 status code

---

## 📱 Mobile App: Search Console App

Download the mobile app for on-the-go monitoring:
- **iOS:** https://apps.apple.com/us/app/google-search-console/
- **Android:** https://play.google.com/store/apps/details?id=com.google.android.apps.searchconsole

**Features:**
- Push notifications for issues
- Quick performance overview
- URL inspection on-the-go

---

## 🎓 Advanced Features (Use Later)

### **URL Parameters**
Tell Google how to handle URL parameters (e.g., ?source=linkedin)

### **International Targeting**
Set geographic target if focusing on specific countries

### **Structured Data**
Monitor rich snippet performance (reviews, FAQs, etc.)

### **Removals**
Temporarily remove URLs from search (use carefully!)

---

## 📈 Expected Timeline

**Day 1:** Setup complete, sitemap submitted  
**Day 3-7:** First data appears in GSC  
**Week 2:** Regular impressions showing  
**Week 4:** First clicks from organic search  
**Month 2:** Consistent data flow, useful insights  
**Month 3:** Enough data for optimization decisions  

---

## 💡 Pro Tips

1. **Check GSC 2-3x per week** (not daily, you'll go crazy)
2. **Focus on impressions first** (clicks come later)
3. **Don't panic over fluctuations** (search is volatile)
4. **Use filters** to find actionable data (top queries, pages)
5. **Export data monthly** for long-term trend analysis
6. **Share access** with team members (Settings → Users)

---

## 🔗 Helpful Resources

**Official Google Docs:**
- GSC Help Center: https://support.google.com/webmasters/
- SEO Starter Guide: https://developers.google.com/search/docs/beginner/seo-starter-guide

**Tutorials:**
- Google Search Console Training (YouTube)
- Moz's GSC Guide: https://moz.com/learn/seo/google-search-console

**Community:**
- r/SEO on Reddit
- Google Search Central Community
- Webmaster Central Help Forum

---

## ✅ Quick Reference Checklist

### **Setup (One-Time):**
- [ ] Create GSC property for baess.app
- [ ] Verify ownership via DNS
- [ ] Submit sitemap.xml
- [ ] Request indexing for key pages
- [ ] Enable email notifications
- [ ] Link with Google Analytics (optional)

### **Weekly Tasks:**
- [ ] Check coverage (indexed pages)
- [ ] Review performance (impressions, clicks)
- [ ] Check for errors/warnings
- [ ] Request indexing for new content

### **Monthly Tasks:**
- [ ] Analyze top queries
- [ ] Identify top-performing pages
- [ ] Review mobile usability
- [ ] Check Core Web Vitals
- [ ] Export data for records

---

## 🎯 Success Criteria

**Week 1:**
✅ Property verified  
✅ Sitemap accepted  
✅ 5+ pages indexed  

**Month 1:**
✅ 1,000+ impressions  
✅ 20+ pages indexed  
✅ No critical errors  

**Month 3:**
✅ 10,000+ impressions  
✅ 500+ clicks  
✅ Ranking for 20+ keywords  

**Month 6:**
✅ 50,000+ impressions  
✅ 2,000+ clicks  
✅ Top 10 for key terms  

---

## 📞 Need Help?

**If you get stuck:**
1. Check the official GSC help docs
2. Search "Google Search Console [your issue]"
3. Post in r/SEO or r/TechSEO on Reddit
4. Contact Google support (for critical issues)

---

**🎉 You're all set!** After completing this guide, your site will be properly connected to Google and ready to start climbing the search rankings.

**Next steps:** Focus on creating high-quality content and building backlinks (see SEO_STRATEGY_BAESS_LABS.md for details).

---

**Last Updated:** November 13, 2025  
**For:** BAESS Labs (baess.app)  
**Estimated Setup Time:** 20-30 minutes

