// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const tamilText = {
  "Home": "முகப்பு", "About": "எங்களை பற்றி", "Stats": "புள்ளிவிவரங்கள்", "Services": "சேவைகள்", "Contact": "தொடர்பு",
  "Welcome back": "மீண்டும் வரவேற்கிறோம்", "Please fill all fields": "அனைத்து புலங்களையும் நிரப்பவும்", "Login failed": "உள்நுழைவு தோல்வியடைந்தது",
  "Please enter email and password": "மின்னஞ்சல் மற்றும் கடவுச்சொல்லை உள்ளிடவும்", "Access denied. Admin privileges required.": "அனுமதி மறுக்கப்பட்டது. நிர்வாக அனுமதி தேவை.",
  "Admin login successful": "நிர்வாக உள்நுழைவு வெற்றி", "Sri Amman Transport management portal": "ஸ்ரீ அம்மன் டிரான்ஸ்போர்ட் நிர்வாக Portal",
  "Signing in…": "உள்நுழைகிறது…", "Password does not meet requirements": "கடவுச்சொல் விதிமுறைகளை பூர்த்தி செய்யவில்லை", "OTP sent to your email": "OTP உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டது",
  "Failed to send OTP": "OTP அனுப்ப முடியவில்லை", "Please start with registration first.": "முதலில் பதிவு செய்யவும்.", "Please enter OTP": "OTP-ஐ உள்ளிடவும்",
  "Account created! Redirecting to login…": "கணக்கு உருவாக்கப்பட்டது! உள்நுழைவுக்கு செல்கிறது…", "Verification failed": "சரிபார்ப்பு தோல்வியடைந்தது",
  "Email not found": "மின்னஞ்சல் கிடைக்கவில்லை", "OTP resent successfully": "OTP மீண்டும் அனுப்பப்பட்டது", "Failed to resend OTP": "OTP மீண்டும் அனுப்ப முடியவில்லை",
  "Verifying…": "சரிபார்க்கிறது…", "Didn't receive it?": "கிடைக்கவில்லையா?", "Verify & Create Account": "சரிபார்த்து கணக்கை உருவாக்கு",
  "Access your transport dashboard": "உங்கள் போக்குவரத்து Dashboard-ஐ அணுகுங்கள்", "Manage fleet and operations": "வாகனங்கள் மற்றும் பணிகளை நிர்வகிக்கவும்",
  "Login": "உள்நுழை", "Logout": "வெளியேறு", "Register": "பதிவு செய்", "User Login": "பயனர் உள்நுழைவு", "Admin Login": "நிர்வாக உள்நுழைவு",
  "Welcome Back": "மீண்டும் வரவேற்கிறோம்", "Choose how you want to continue": "எப்படி தொடர விரும்புகிறீர்கள் என்பதை தேர்வு செய்யுங்கள்",
  "Register here": "இங்கே பதிவு செய்க", "No account?": "கணக்கு இல்லையா?", "Sign In": "உள்நுழை", "Sign In as Admin": "நிர்வாகியாக உள்நுழை",
  "Create Account": "கணக்கை உருவாக்கு", "Secure sign-up with OTP verification": "OTP சரிபார்ப்புடன் பாதுகாப்பான பதிவு",
  "Continue with OTP →": "OTP-யுடன் தொடருங்கள் →", "Already have an account?": "ஏற்கனவே கணக்கு உள்ளதா?", "Sign in": "உள்நுழை",
  "Check your email": "உங்கள் மின்னஞ்சலை சரிபார்க்கவும்", "We sent a 6-digit code to": "6 இலக்க குறியீடு அனுப்பப்பட்டுள்ளது",
  "Resend OTP": "OTP-ஐ மீண்டும் அனுப்பு", "Back to Register": "← பதிவுக்கு திரும்பு",
  "Admin Portal": "நிர்வாக Portal", "Restricted Access": "அனுமதி உள்ளவர்களுக்கு மட்டும்", "Admin Sign In": "நிர்வாக உள்நுழைவு",
  "Admin Email": "நிர்வாக மின்னஞ்சல்", "Back to Home": "← முகப்புக்கு திரும்பு", "Email": "மின்னஞ்சல்", "Password": "கடவுச்சொல்",
  "Show": "காண்பி", "Hide": "மறை", "Remember me": "என்னை நினைவில் வைத்துக்கொள்", "Forgot password?": "கடவுச்சொல் மறந்துவிட்டதா?",
  "New here?": "இங்கு புதிதா?", "Create account": "கணக்கை உருவாக்கு", "Admin?": "நிர்வாகியா?", "Admin login →": "நிர்வாக உள்நுழைவு →",
  "First Name": "முதல் பெயர்", "Last Name": "கடைசி பெயர்", "Uppercase letter": "பெரிய எழுத்து", "Lowercase letter": "சிறிய எழுத்து",
  "At least 8 characters": "குறைந்தது 8 எழுத்துகள்", "Numeric digit": "ஒரு எண்", "Special symbol (!@#$%^&*)": "சிறப்பு குறியீடு (!@#$%^&*)",
  "Dashboard": "Dashboard", "Add Goods": "பொருட்களை சேர்", "Bookings": "முன்பதிவுகள்", "History": "வரலாறு", "Ratings": "மதிப்பீடுகள்", "Messages": "செய்திகள்", "Drivers": "ஓட்டுநர்கள்",
  "Change theme": "Theme மாற்று", "Go to site": "தளத்திற்கு செல்", "Overview of Sri Amman Transport operations": "ஸ்ரீ அம்மன் டிரான்ஸ்போர்ட் பணிகளின் மேலோட்டம்",
  "Bricks": "செங்கல்", "M-Sand": "M-மணல்", "River Sand": "ஆற்று மணல்", "Dry Grass Rolls": "உலர் புல் ரோல்கள்",
  "WireCut Bricks": "WireCut செங்கல்", "Box Bricks": "Box செங்கல்", "Normal Bricks": "சாதாரண செங்கல்",
  "Fly Ash Bricks": "ஃபிளை ஆஷ் செங்கல்", "Red Clay Bricks": "சிவப்பு களிமண் செங்கல்", "Chamber Bricks": "சேம்பர் செங்கல்",
  "Select Brick Type": "செங்கல் வகையை தேர்வு செய்யவும்", "Brick Type": "செங்கல் வகை",
  "Upload Photo": "புகைப்படம் பதிவேற்றவும்", "Cover Photo": "முதன்மை படம்", "Default Preview": "இயல்புநிலை முன்னோட்டம்",
  "Available": "கிடைக்கும்", "Limited": "குறைவாக உள்ளது", "Full": "முழுவதும் முன்பதிவு", "Pending": "நிலுவையில்", "Confirmed": "உறுதி செய்யப்பட்டது", "Rejected": "நிராகரிக்கப்பட்டது", "Delivered": "வழங்கப்பட்டது", "Revoked": "ரத்து செய்யப்பட்டது",
  "Loading…": "ஏற்றப்படுகிறது…", "Loading...": "ஏற்றப்படுகிறது...", "Save": "சேமி", "Cancel": "ரத்து செய்", "Delete": "நீக்கு", "Edit": "திருத்து", "Search": "தேடு",
  "Your account": "உங்கள் கணக்கு", "Booking History": "முன்பதிவு வரலாறு", "Track every booking and admin decision in one place.": "அனைத்து முன்பதிவுகள் மற்றும் நிர்வாக முடிவுகளை ஒரே இடத்தில் பார்க்கவும்.",
  "Book materials": "பொருட்களை முன்பதிவு செய்", "Loading your bookings...": "உங்கள் முன்பதிவுகள் ஏற்றப்படுகின்றன...", "No bookings yet": "இன்னும் முன்பதிவுகள் இல்லை", "Your booking history will appear here after you place an order.": "ஆர்டர் செய்த பிறகு உங்கள் முன்பதிவு வரலாறு இங்கே தோன்றும்.",
  "Material booking": "பொருள் முன்பதிவு", "Transport booking": "போக்குவரத்து முன்பதிவு", "Qty": "அளவு", "Update: ": "நிலை: ", "Feedback submitted": "கருத்து அனுப்பப்பட்டது", "Give feedback": "கருத்து சொல்லுங்கள்",
  "Updates": "புதுப்பிப்புகள்", "Notifications": "அறிவிப்புகள்", "Booking updates from the last 24 hours.": "கடந்த 24 மணி நேர முன்பதிவு புதுப்பிப்புகள்.", "Profile": "சுயவிவரம்", "Loading notifications...": "அறிவிப்புகள் ஏற்றப்படுகின்றன...", "No new notifications": "புதிய அறிவிப்புகள் இல்லை", "New booking decisions will appear here for 24 hours.": "புதிய முன்பதிவு முடிவுகள் 24 மணி நேரம் இங்கே தோன்றும்.",
  "Assigned driver": "ஒதுக்கப்பட்ட ஓட்டுநர்", "Estimated total": "மதிப்பிடப்பட்ட மொத்தம்", "Call": "அழைக்க", "Share your feedback": "உங்கள் கருத்தை பகிருங்கள்", "Your name": "உங்கள் பெயர்", "How was our service?": "எங்கள் சேவை எப்படி இருந்தது?", "What should we improve? (optional)": "எதை மேம்படுத்த வேண்டும்? (விருப்பம்)", "Your rating": "உங்கள் மதிப்பீடு", "Submit feedback": "கருத்தை அனுப்பு",
  "Working on it": "செயல்படுத்தப்படுகிறது", "Please wait while we complete your request.": "உங்கள் கோரிக்கையை முடிக்கும் வரை காத்திருக்கவும்.", "Approved by admin.": "நிர்வாகி ஒப்புதல் அளித்துள்ளார்.", "Successfully delivered.": "வெற்றிகரமாக வழங்கப்பட்டது.", "Waiting for admin approval.": "நிர்வாகி ஒப்புதலுக்காக காத்திருக்கிறது.", "No reason provided": "காரணம் குறிப்பிடப்படவில்லை",
  "Signing In": "உள்நுழைகிறது", "Verifying your credentials and signing you in…": "உங்கள் தகவல்கள் சரிபார்க்கப்பட்டு உள்நுழையப்படுகிறது…",
  "Sending OTP": "OTP அனுப்பப்படுகிறது", "Sending verification code to your email…": "உங்கள் மின்னஞ்சலுக்கு சரிபார்ப்பு குறியீடு அனுப்பப்படுகிறது…",
  "Verifying OTP": "OTP சரிபார்க்கப்படுகிறது", "Checking verification code and creating account…": "குறியீடு சரிபார்க்கப்பட்டு கணக்கு உருவாக்கப்படுகிறது…",
  "Updating Profile": "சுயவிவரம் புதுப்பிக்கப்படுகிறது", "Saving your updated account information…": "உங்கள் புதுப்பிக்கப்பட்ட கணக்கு விவரங்கள் சேமிக்கப்படுகின்றன…",
  "Confirming Booking": "முன்பதிவு உறுதி செய்யப்படுகிறது", "Approving booking and assigning driver…": "முன்பதிவு அங்கீகரிக்கப்பட்டு ஓட்டுநர் ஒதுக்கப்படுகிறார்…",
  "Rejecting Booking": "முன்பதிவு நிராகரிக்கப்படுகிறது", "Processing booking rejection and notifying user…": "முன்பதிவு நிராகரிப்பு செயல்படுத்தப்படுகிறது…",
  "Revoking Booking": "முன்பதிவு ரத்து செய்யப்படுகிறது", "Revoking booking and restoring material stock…": "முன்பதிவு ரத்து செய்யப்பட்டு பொருள் இருப்பு மீட்டெடுக்கப்படுகிறது…",
  "Marking as Delivered": "வழங்கப்பட்டதாக குறிக்கப்படுகிறது", "Completing delivery and updating records…": "டெலிவரி முடிக்கப்பட்டு பதிவுகள் புதுப்பிக்கப்படுகின்றன…",
  "Reviewing Cancellation": "ரத்து கோரிக்கை பரிசீலிக்கப்படுகிறது", "Processing cancellation review decision…": "ரத்து முடிவு செயல்படுத்தப்படுகிறது…",
  "Requesting Cancellation": "ரத்து கோரிக்கை அனுப்பப்படுகிறது", "Submitting cancellation request to admin…": "நிர்வாகிக்கு ரத்து கோரிக்கை அனுப்பப்படுகிறது…",
  "Cancelling Booking": "முன்பதிவு ரத்து செய்யப்படுகிறது", "Cancelling booking and restoring material…": "முன்பதிவு ரத்து செய்யப்பட்டு பொருள் மீட்டெடுக்கப்படுகிறது…",
  "Booking Material": "பொருள் முன்பதிவு செய்யப்படுகிறது", "Confirming your transport order…": "உங்கள் போக்குவரத்து ஆர்டர் உறுதி செய்யப்படுகிறது…",
  "Deleting History": "வரலாறு நீக்கப்படுகிறது", "Removing booking history record…": "முன்பதிவு வரலாற்று பதிவு நீக்கப்படுகிறது…",
  "Adding Material": "பொருள் சேர்க்கப்படுகிறது", "Saving new stock entry to catalog…": "புதிய பொருள் இருப்பு சேமிக்கப்படுகிறது…",
  "Updating Material": "பொருள் புதுப்பிக்கப்படுகிறது", "Saving material and stock modifications…": "பொருள் மாற்றங்கள் சேமிக்கப்படுகின்றன…",
  "Deleting Material": "பொருள் நீக்கப்படுகிறது", "Removing material from available inventory…": "பொருள் இருப்பிலிருந்து நீக்கப்படுகிறது…",
  "Adding Driver": "ஓட்டுநர் சேர்க்கப்படுகிறார்", "Adding new driver profile to fleet…": "புதிய ஓட்டுநர் விவரங்கள் சேர்க்கப்படுகின்றன…",
  "Updating Driver": "ஓட்டுநர் புதுப்பிக்கப்படுகிறார்", "Saving driver details and assignment status…": "ஓட்டுநர் விவரங்கள் சேமிக்கப்படுகின்றன…",
  "Removing Driver": "ஓட்டுநர் நீக்கப்படுகிறார்", "Removing driver from active fleet…": "ஓட்டுநர் குழுவிலிருந்து நீக்கப்படுகிறார்…",
  "Sending Message": "செய்தி அனுப்பப்படுகிறது", "Sending your message to Sri Amman Transport…": "உங்கள் செய்தி ஸ்ரீ அம்மன் டிரான்ஸ்போர்ட்டிற்கு அனுப்பப்படுகிறது…",
  "Sending Reply": "பதில் அனுப்பப்படுகிறது", "Saving and sending reply to customer…": "வாடிக்கையாளருக்கு பதில் அனுப்பப்படுகிறது…",
  "Deleting Message": "செய்தி நீக்கப்படுகிறது", "Removing message from your inbox…": "செய்தி நீக்கப்படுகிறது…",
  "Submitting Feedback": "கருத்து சமர்ப்பிக்கப்படுகிறது", "Recording your rating and review comments…": "உங்கள் மதிப்பீடு மற்றும் கருத்து பதிவு செய்யப்படுகிறது…",
  "Uploading Avatar": "சுயவிவர படம் பதிவேற்றப்படுகிறது", "Uploading profile photo to secure storage…": "சுயவிவர படம் பதிவேற்றப்படுகிறது…",
  "Uploading Driver Photo": "ஓட்டுநர் படம் பதிவேற்றப்படுகிறது", "Uploading driver portrait photo…": "ஓட்டுநர் படம் பதிவேற்றப்படுகிறது…",
  "Uploading Material Images": "பொருள் படங்கள் பதிவேற்றப்படுகின்றன", "Uploading Material Image": "பொருள் படம் பதிவேற்றப்படுகிறது", "Uploading material photo to Cloudinary…": "பொருள் படம் பதிவேற்றப்படுகிறது…",
  "Deleting Item": "உருப்படி நீக்கப்படுகிறது", "Please wait while we remove this record…": "பதிவு நீக்கப்படும் வரை காத்திருக்கவும்…",
  "Creating Record": "பதிவு உருவாக்கப்படுகிறது", "Please wait while we process your request…": "கோரிக்கை செயலாக்கப்படும் வரை காத்திருக்கவும்…",
  "Saving Changes": "மாற்றங்கள் சேமிக்கப்படுகின்றன", "Please wait while we save your changes…": "மாற்றங்கள் சேமிக்கப்படும் வரை காத்திருக்கவும்…",
  "Loading dashboard analytics…": "Dashboard புள்ளிவிவரங்கள் ஏற்றப்படுகின்றன…", "Aggregating bookings, drivers, and revenue data": "முன்பதிவுகள், ஓட்டுநர்கள் மற்றும் வருவாய் தரவுகள் திரட்டப்படுகின்றன",
  "Loading driver fleet…": "ஓட்டுநர் விவரங்கள் ஏற்றப்படுகின்றன…", "Loading customer messages…": "வாடிக்கையாளர் செய்திகள் ஏற்றப்படுகின்றன…", "Loading material inventory…": "பொருட்கள் இருப்பு ஏற்றப்படுகிறது…",
  "Cancelled": "ரத்து செய்யப்பட்டது", "Successfully Delivered": "வெற்றிகரமாக வழங்கப்பட்டது", "Your assigned driver details are below.": "உங்களுக்கு ஒதுக்கப்பட்ட ஓட்டுநர் விவரங்கள் கீழே உள்ளன.", "Booking update": "முன்பதிவு புதுப்பிப்பு",
  "Update your details and review your booking history.": "உங்கள் விவரங்களை புதுப்பித்து முன்பதிவு வரலாற்றைப் பார்க்கவும்.", "First name": "முதல் பெயர்", "Last name": "கடைசி பெயர்", "Email address": "மின்னஞ்சல் முகவரி", "Saving...": "சேமிக்கிறது...", "Save changes": "மாற்றங்களை சேமி", "Booking history": "முன்பதிவு வரலாறு", "All your material booking requests and decisions.": "உங்கள் அனைத்து பொருள் முன்பதிவு கோரிக்கைகள் மற்றும் முடிவுகள்.", "New booking": "புதிய முன்பதிவு", "Loading history...": "வரலாறு ஏற்றப்படுகிறது...", "No bookings yet.": "இன்னும் முன்பதிவுகள் இல்லை.",
  "Live Metrics": "நேரடி அளவீடுகள்", "Recent Bookings": "சமீபத்திய முன்பதிவுகள்", "Latest customer booking requests": "சமீபத்திய வாடிக்கையாளர் முன்பதிவு கோரிக்கைகள்", "Today's Summary": "இன்றைய சுருக்கம்", "New Bookings": "புதிய முன்பதிவுகள்", "Deliveries Done": "முடிந்த டெலிவரிகள்", "Revenue This Month": "இந்த மாத வருமானம்", "Driver Details": "ஓட்டுநர் விவரங்கள்", "All Drivers": "அனைத்து ஓட்டுநர்கள்", "Manage your driver fleet": "உங்கள் ஓட்டுநர் குழுவை நிர்வகிக்கவும்", "Add Driver": "ஓட்டுநரை சேர்", "Update Driver": "ஓட்டுநரை புதுப்பி", "Profile Image (optional)": "சுயவிவர படம் (விருப்பம்)", "Uploading image...": "படம் பதிவேற்றப்படுகிறது...", "Image stored in Cloudinary. If empty, the first letter is shown.": "படம் Cloudinary-ல் சேமிக்கப்படும். படம் இல்லையெனில் முதல் எழுத்து காட்டப்படும்.", "Driver updated": "ஓட்டுநர் புதுப்பிக்கப்பட்டார்", "Driver added": "ஓட்டுநர் சேர்க்கப்பட்டார்", "Driver removed": "ஓட்டுநர் நீக்கப்பட்டார்", "Failed to load drivers": "ஓட்டுநர்களை ஏற்ற முடியவில்லை", "Failed to remove driver": "ஓட்டுநரை நீக்க முடியவில்லை", "experience": "அனுபவம்",
  "Customer voice": "வாடிக்கையாளர் கருத்து", "Review the feedback submitted after delivery.": "டெலிவரிக்குப் பிறகு வந்த கருத்துகளை பார்க்கவும்.", "reviews": "கருத்துகள்", "Search ratings...": "மதிப்பீடுகளை தேடுங்கள்...", "Loading ratings...": "மதிப்பீடுகள் ஏற்றப்படுகின்றன...", "No ratings found.": "மதிப்பீடுகள் இல்லை", "Improve": "மேம்படுத்த வேண்டியது",
  "Customer enquiries and contact requests": "வாடிக்கையாளர் கேள்விகள் மற்றும் தொடர்பு கோரிக்கைகள்", "All": "அனைத்தும்", "Unread": "படிக்காதவை", "Read": "படித்தவை", "No messages": "செய்திகள் இல்லை", "Reply saved for": "பதில் சேமிக்கப்பட்டது:", "Failed to send reply": "பதில் அனுப்ப முடியவில்லை", "Message deleted": "செய்தி நீக்கப்பட்டது", "Failed to delete": "நீக்க முடியவில்லை", "Please type a reply": "பதிலை உள்ளிடவும்", "Edit Reply": "பதிலை திருத்து", "Reply": "பதில்", "Save Reply": "பதிலை சேமி", "Select a message to read": "படிக்க ஒரு செய்தியை தேர்வு செய்யவும்", "Click any message on the left": "இடப்பக்கத்தில் உள்ள செய்தியை கிளிக் செய்யவும்",
  "Cancellation Requests": "ரத்து கோரிக்கைகள்", "Cancel Order": "ஆர்டரை ரத்து செய்", "Order Already On The Way": "ஆர்டர் ஏற்கனவே புறப்பட்டுவிட்டது", "Send Notification": "அறிவிப்பு அனுப்பு", "Customer Details": "வாடிக்கையாளர் விவரங்கள்", "Calling Details": "அழைப்பு விவரங்கள்", "Order Details": "ஆர்டர் விவரங்கள்", "Cancellation Reason": "ரத்து செய்வதற்கான காரணம்", "Pending Review": "பரிசீலனையில் உள்ளது", "Cancelled & Approved": "ரத்து செய்யப்பட்டது & ஒப்புதல் அளிக்கப்பட்டது", "Rejected / On The Way": "நிராகரிக்கப்பட்டது / வழியில் உள்ளது", "Confirm Order Cancellation": "ஆர்டர் ரத்து செய்வதை உறுதிப்படுத்து",

  "This Month Order Status": "இந்த மாத ஆர்டர் நிலை", "Available Driver Counts": "கிடைக்கும் ஓட்டுநர்கள் எண்ணிக்கை", "vs previous month": "முந்தைய மாதத்துடன் ஒப்பிடுகையில்",
  "This Month Analysis": "இந்த மாத பகுப்பாய்வு", "Overall Analysis": "ஒட்டுமொத்த பகுப்பாய்வு", "Order Status & Top Earning Materials": "ஆர்டர் நிலை & அதிக வருவாய் தரும் பொருட்கள்", "Orders": "ஆர்டர்கள்", "Order Status Pie Chart": "ஆர்டர் நிலை வட்ட வரைபடம்", "Top Earning Materials": "அதிக வருவாய் தரும் பொருட்கள்",
  "Add": "சேர்", "Update": "புதுப்பி", "updated": "புதுப்பிக்கப்பட்டது", "added": "சேர்க்கப்பட்டது", "Saving…": "சேமிக்கிறது…", "Failed to load goods": "பொருட்களை ஏற்ற முடியவில்லை", "Failed to load available drivers": "கிடைக்கும் ஓட்டுநர்களை ஏற்ற முடியவில்லை", "Failed to save": "சேமிக்க முடியவில்லை", "Select Goods Type": "பொருள் வகையை தேர்வு செய்யவும்", "Choose the type of goods you want to add": "சேர்க்க வேண்டிய பொருள் வகையை தேர்வு செய்யவும்", "Images (up to 4)": "படங்கள் (அதிகபட்சம் 4)", "Status": "நிலை", "Assign Driver": "ஓட்டுநரை ஒதுக்கவும்", "Select an available driver": "கிடைக்கும் ஓட்டுநரை தேர்வு செய்யவும்", "No available drivers found. Add an available driver first.": "கிடைக்கும் ஓட்டுநர்கள் இல்லை. முதலில் ஓட்டுநரை சேர்க்கவும்.", "Default image preview": "இயல்புநிலை பட முன்னோட்டம்", "custom image(s) ready to save": "தனிப்பயன் படங்கள் சேமிக்க தயார்", "Compressing image...": "படம் சுருக்கப்படுகிறது...", "Current Stock": "தற்போதைய இருப்பு", "entries": "பதிவுகள்", "Manage available transport stock": "கிடைக்கும் போக்குவரத்து இருப்பை நிர்வகிக்கவும்",
  "Completed and closed bookings": "முடிந்த மற்றும் மூடப்பட்ட முன்பதிவுகள்", "Rejected, revoked, and successfully delivered records.": "நிராகரிக்கப்பட்ட, ரத்து செய்யப்பட்ட மற்றும் வழங்கப்பட்ட பதிவுகள்.", "Search history...": "வரலாற்றை தேடுங்கள்...", "No history records found.": "வரலாறு பதிவுகள் இல்லை", "History deleted": "வரலாறு நீக்கப்பட்டது", "Failed to delete history": "வரலாற்றை நீக்க முடியவில்லை", "Bookings Dashboard": "முன்பதிவு Dashboard", "Manage, inspect, and approve orders in real-time": "ஆர்டர்களை நேரடியாக நிர்வகித்து, பார்த்து, ஒப்புதல் அளிக்கவும்", "Search customer, item, title...": "வாடிக்கையாளர், பொருள், தலைப்பை தேடுங்கள்...", "Loading bookings records...": "முன்பதிவு பதிவுகள் ஏற்றப்படுகின்றன...", "Booking confirmed": "முன்பதிவு உறுதி செய்யப்பட்டது", "Failed to confirm": "உறுதி செய்ய முடியவில்லை", "Booking rejected": "முன்பதிவு நிராகரிக்கப்பட்டது", "Failed to reject": "நிராகரிக்க முடியவில்லை", "Booking revoked and availability restored": "முன்பதிவு ரத்து செய்யப்பட்டு இருப்பு மீட்டெடுக்கப்பட்டது", "Failed to revoke": "ரத்து செய்ய முடியவில்லை", "Booking marked as successfully delivered": "முன்பதிவு வெற்றிகரமாக வழங்கப்பட்டதாக குறிக்கப்பட்டது", "Failed to mark delivered": "வழங்கியதாக குறிக்க முடியவில்லை", "Please enter a reason": "காரணத்தை உள்ளிடவும்",
  "Owner": "உரிமையாளர்", "Meet Our Visionary": "எங்கள் வழிகாட்டியை சந்திக்கவும்", "Owner & CEO": "உரிமையாளர் மற்றும் CEO", "Materials": "பொருட்கள்", "Variety of Bricks": "செங்கல் வகைகள்", "Explore our extensive range of high-quality building materials.": "உயர்தர கட்டுமான பொருட்களின் எங்கள் பல்வேறு வகைகளை பாருங்கள்.",
  "Route unavailable": "இந்த பக்கம் கிடைக்கவில்லை", "This page took a wrong turn.": "இந்த பக்கம் வேறு வழிக்கு சென்றுவிட்டது.", "The page you are looking for does not exist or may have moved.": "நீங்கள் தேடும் பக்கம் இல்லை அல்லது மாற்றப்பட்டிருக்கலாம்.", "Back to home": "முகப்புக்கு திரும்பு",
  "Choose delivery location": "டெலிவரி இடத்தை தேர்வு செய்யவும்", "Click the map to select the delivery point.": "டெலிவரி இடத்தை தேர்வு செய்ய வரைபடத்தில் கிளிக் செய்யவும்.", "Search village, city or place": "கிராமம், நகரம் அல்லது இடத்தை தேடுங்கள்", "Search for a location": "இடத்தை தேடுங்கள்", "Use current location": "தற்போதைய இடத்தை பயன்படுத்து", "Use this location": "இந்த இடத்தை பயன்படுத்து", "A complete address was not found here": "இங்கே முழுமையான முகவரி கிடைக்கவில்லை", "Could not find the address. Try another point.": "முகவரியை கண்டுபிடிக்க முடியவில்லை. வேறு இடத்தை முயற்சிக்கவும்.", "Could not find that location.": "அந்த இடத்தை கண்டுபிடிக்க முடியவில்லை.", "Could not access your location. Allow location permission and try again.": "உங்கள் இடத்தை அணுக முடியவில்லை. அனுமதி வழங்கி மீண்டும் முயற்சிக்கவும்.", "Phone number must contain exactly 10 digits": "தொலைபேசி எண்ணில் சரியாக 10 இலக்கங்கள் இருக்க வேண்டும்", "Pincode must contain exactly 6 digits": "அஞ்சல் குறியீட்டில் சரியாக 6 இலக்கங்கள் இருக்க வேண்டும்", "Quantity must contain numbers only": "அளவில் எண்கள் மட்டும் இருக்க வேண்டும்", "Enter a valid quantity": "சரியான அளவை உள்ளிடவும்", "Only": "கிடைப்பது", "bricks": "செங்கல்கள்", "rolls": "ரோல்கள்", "units": "அலகுகள்",
};

const translateValue = (value, lang) => lang === "ta" && typeof value === "string" ? tamilText[value] || value : value;

export const translations = {
  en: {
    // Navbar
    home: "Home", about: "About", stats: "Stats", services: "Services", contact: "Contact",
    login: "Login", logout: "Logout", userLogin: "User Login", adminLogin: "Admin Login", register: "Register",
    // Hero
    getStarted: "Get Started →", viewStocks: "View Available Stocks →", learnMore: "Learn More",
    // About
    aboutTag: "About Us",
    aboutTitle: "Salem's Most Trusted\nMaterial Transport",
    aboutP1: "Established in Salem, Tamil Nadu, we have been the go-to lorry service for construction and agricultural materials since 2010. We transport bricks, M-sand, river sand and dry grass rolls to every corner of Tamil Nadu.",
    aboutP2: "Our fleet of open lorries and tippers serves builders, contractors, dairy farmers and cattle owners — delivering kiln-fresh bricks, licensed quarry sand and farm-direct dry grass rolls safely and on time.",
    badge1: "Salem Based", badge2: "Licensed Sand Quarry", badge3: "TN-Wide Delivery", badge4: "Instant Booking",
    yearsLabel: "Years of Service",
    ownerTag: "Owner", ownerTitle: "Meet Our Visionary", ownerBio: "With a strong vision and hard work, our owner has been the main reason behind the success of Sri Amman Transport. The journey started from a very humble beginning and is truly inspiring. He began his career as a driver and worked with dedication every day. Later, he started a small puncture shop and slowly built his experience in the transport field. With great confidence and courage, he bought his first lorry on EMI. That single lorry became the foundation for a much bigger dream. Through continuous effort, honesty, and determination, he successfully built Sri Amman Transport into a trusted name in logistics and building materials. Under his leadership, the company always focuses on quality service, on-time delivery, and customer satisfaction.", ownerRole: "Owner & CEO",
    // Stats
    statsTag: "Our Numbers", statsTitle: "Trusted Across Tamil Nadu",
    statsSub: "Numbers that reflect our commitment to Salem's construction and farming community.",
    stat1: "Years Experience", stat2: "Happy Customers", stat3: "Lorries", stat4: "Successful Deliveries",
    // Services
    servicesTag: "What We Transport", servicesTitle: "Our Services",
    servicesSub: "Salem's trusted lorry service for bricks, M-sand, dry grass rolls and river sand — delivered across Tamil Nadu.",
    bookNow: "Book Now →",
    s1t: "Bricks Transport",
    s1d: "Bulk transport of red bricks and fly-ash bricks from Salem kilns to construction sites across Tamil Nadu. Full lorry loads available.",
    s2t: "M-Sand (Manufactured Sand)",
    s2d: "Reliable delivery of M-sand from Salem crushing units to builders and contractors. Available in 6-wheel and 10-wheel lorry loads.",
    s3t: "Dry Grass Rolls",
    s3d: "Safe transport of dry grass rolls and hay bales from farms near Salem to dairy farms and cattle owners across Salem.",
    s4t: "River Sand",
    s4d: "Licensed river sand transport from approved quarries near Salem to construction sites. Fully compliant with TN government regulations.",
   
    // Contact
    contactTag: "Get In Touch", contactTitle: "Contact Us",
    contactSub: "Based in Salem. Ready to deliver bricks and sand  anywhere in Tamil Nadu.",
    driversTag: "Our Fleet", driversTitle: "Meet Our Drivers",
    driversSub: "Experienced drivers ready to deliver your materials safely and on time.",
    noDrivers: "Driver details will appear here soon.", driverLoading: "Loading drivers…",
    driverAvailable: "Available", driverOnDuty: "On Duty", driverOffDuty: "Off Duty",
    officeLabel: "Address", phoneLabel: "Phone", emailLabel: "Email", hoursLabel: "Working Hours",
    officeDetail: "No 15 mel vakuthanur ,Periyeripatti,Omalur(TLK),Salem(DT),Tamil Nadu-636503",
    phoneDetail: "+91 9787216797",
    emailDetail: "elumalaitn30r0834@gmail.com",
    hoursDetail: "Mon – Sun: 24/7",
    formTitle: "Send a Message",
    namePh: "Your Name", emailPh: "Email Address", subjectPh: "Subject", msgPh: "Your message…",
    sendBtn: "Send Message",
    // Footer
    footerDesc: "Salem-based lorry service for bricks, M-sand, river sand and dry grass rolls. Serving Tamil Nadu since 2010.",
    quickLinks: "Quick Links", footerServices: "Services", legal: "Legal", downloadApp: "Download App",
    fl1: "Home", fl2: "About Us", fl3: "Services", fl4: "Contact", fl5: "Careers",
    fs1: "Bricks Transport", fs2: "M-Sand Delivery", fs3: "Dry Grass Rolls", fs4: "River Sand", fs5: "Mixed Loads", fs6: "Bulk Grass & Feed",
    ll1: "Privacy Policy", ll2: "Terms of Service", ll3: "Refund Policy",
    copyright: "Sri Amman Transport Co. All rights reserved.",
    madeIn: "Made with ❤️ in Salem, Tamil Nadu",
    // Stocks
    stocksTag: "Live Inventory", stocksTitle: "Available Lorry Slots",
    stocksWelcome: "Welcome back,", stocksDesc: "Current available lorry slots for bricks, M-sand, dry grass rolls and river sand.",
    totalRoutes: "Total Listings", available: "Available", fullyBooked: "Fully Booked",
    material: "Material", vehicleType: "Vehicle Type", capacity: "Capacity", slots: "Available Slots",
    price: "Price / Load", status: "Status", action: "Action",
    book: "Book", fullLabel: "Fully Booked",
    stockNote: "Stock data refreshes every 5 minutes. Prices are per lorry load and indicative.",
    // Slides
    slide1tag: "Sri Amman Transport · Salem", slide1title: "Reliable Goods Transport,", slide1accent: "Book Lorry Loads Online",
    slide1sub: "Salem's trusted heavy transport service for construction materials, chamber bricks, sand, and agricultural goods across Tamil Nadu with guaranteed delivery.",
    slide2tag: "Chamber Bricks Transport", slide2title: "Kiln-Fresh Red Bricks,", slide2accent: "Direct to Your Site",
    slide2sub: "Full lorry loads of certified Grade-1 chamber burnt red clay bricks transported directly from top Salem kilns to your building site with zero breakage.",
    slide3tag: "M-Sand & River Sand", slide3title: "Certified Quarry Sand,", slide3accent: "For Strong Masonry",
    slide3sub: "High-grade M-Sand and P-Sand from Salem crushing units and licensed river sand from approved quarries, delivered by heavy tippers on time.",
    slide4tag: "Agricultural Feed Transport", slide4title: "Farm-Fresh Dry Grass,", slide4accent: "For Dairy & Cattle",
    slide4sub: "Nutrient-rich dry grass rolls and premium hay bales transported swiftly from Salem farmlands to dairy owners and cattle farms across Tamil Nadu.",
  },
  ta: {
    // Navbar
    home: "முகப்பு", about: "எங்களை பற்றி", stats: "புள்ளிவிவரங்கள்", services: "சேவைகள்", contact: "தொடர்பு",
    login: "உள்நுழை", logout: "வெளியேறு", userLogin: "பயனர் உள்நுழைவு", adminLogin: "நிர்வாக உள்நுழைவு", register: "பதிவு செய்",
    // Hero
    getStarted: "தொடங்குங்கள் →", viewStocks: "கிடைக்கும் இடங்களை காண்க →", learnMore: "மேலும் அறிய",
    // About
    aboutTag: "எங்களை பற்றி",
    aboutTitle: "சேலத்தின் நம்பகமான\nபொருள் போக்குவரத்து",
    aboutP1: "சேலம், தமிழ்நாட்டில் தொடங்கப்பட்ட எங்கள் நிறுவனம் 2010 முதல் கட்டுமான மற்றும் விவசாய பொருட்களுக்கான நம்பகமான லாரி சேவையாக உள்ளது. செங்கல், M-மணல், ஆற்று மணல் மற்றும் உலர் புல் ரோல்களை தமிழ்நாடு முழுவதும் கொண்டு செல்கிறோம்.",
    aboutP2: "எங்கள் திறந்த லாரிகள் மற்றும் டிப்பர்கள் கட்டிட ஒப்பந்தகாரர்கள், பால் பண்ணை உரிமையாளர்கள் மற்றும் கால்நடை விவசாயிகளுக்கு சேவை செய்கின்றன — சூளை-புதிய செங்கல், உரிமம் பெற்ற குவாரி மணல் மற்றும் பண்ணை-நேரடி உலர் புல் ரோல்களை பாதுகாப்பாக கொண்டு செல்கிறோம்.",
    badge1: "சேலம் தலைமையகம்", badge2: "உரிமம் பெற்ற மணல் குவாரி", badge3: "தமிழ்நாடு முழுவதும்", badge4: "உடனடி முன்பதிவு",
    yearsLabel: "சேவை ஆண்டுகள்",
    ownerTag: "உரிமையாளர்", ownerTitle: "எங்கள் வழிகாட்டியை சந்திக்கவும்", ownerBio: "தெளிவான பார்வையும் கடின உழைப்பும் கொண்ட எங்கள் உரிமையாளர், ஸ்ரீ அம்மன் டிரான்ஸ்போர்ட்டின் வெற்றிக்கு முக்கிய காரணமாக உள்ளார். இந்த பயணம் மிகவும் எளிய தொடக்கத்திலிருந்து ஆரம்பித்து, இன்று ஒரு சிறந்த வளர்ச்சியாக மாறியுள்ளது. அவர் முதலில் ஓட்டுநராக தனது பணியைத் தொடங்கி, தினமும் அர்ப்பணிப்புடன் உழைத்தார். பின்னர் ஒரு சிறிய பஞ்சர் கடையைத் தொடங்கி, போக்குவரத்து துறையில் தனது அனுபவத்தை மெதுவாக வளர்த்தார். தன்னம்பிக்கையுடனும் துணிச்சலுடனும் EMI மூலம் தனது முதல் லாரியை வாங்கினார். அந்த ஒரு லாரியே பெரிய கனவுக்கு அடித்தளமாக அமைந்தது. தொடர்ந்து செய்த உழைப்பு, நேர்மை மற்றும் விடாமுயற்சியால் ஸ்ரீ அம்மன் டிரான்ஸ்போர்ட்டை போக்குவரத்து மற்றும் கட்டுமான பொருட்கள் துறையில் நம்பகமான நிறுவனமாக உருவாக்கினார். அவரது தலைமையில் தரமான சேவை, சரியான நேரத்தில் டெலிவரி மற்றும் வாடிக்கையாளர் திருப்தி ஆகியவற்றுக்கு நிறுவனம் எப்போதும் முக்கியத்துவம் அளிக்கிறது.", ownerRole: "உரிமையாளர் மற்றும் CEO",
    // Stats
    statsTag: "எங்கள் சாதனைகள்", statsTitle: "தமிழ்நாடு நம்பும் நிறுவனம்",
    statsSub: "சேலத்தின் கட்டுமான மற்றும் விவசாய சமூகத்திற்கான எங்கள் அர்ப்பணிப்பை காட்டும் எண்கள்.",
    stat1: "ஆண்டு அனுபவம்", stat2: "மகிழ்ச்சியான வாடிக்கையாளர்கள்", stat3: "லாரிகள்", stat4: "வெற்றிகரமான டெலிவரிகள்",
    // Services
    servicesTag: "நாங்கள் போக்குவரத்து செய்வது", servicesTitle: "எங்கள் சேவைகள்",
    servicesSub: "செங்கல், M-மணல், உலர் புல் ரோல்கள் மற்றும் ஆற்று மணலுக்கான சேலத்தின் நம்பகமான லாரி சேவை — தமிழ்நாடு முழுவதும்.",
    bookNow: "இப்போது முன்பதிவு செய் →",
    s1t: "செங்கல் போக்குவரத்து",
    s1d: "சேலம் சூளைகளிலிருந்து செங்கல் மற்றும் ஃப்ளை-ஆஷ் செங்கல்களை தமிழ்நாடு கட்டுமான தளங்களுக்கு மொத்தமாக கொண்டு செல்கிறோம்.",
    s2t: "M-மணல் (தயாரிக்கப்பட்ட மணல்)",
    s2d: "சேலம் க்ரஷிங் யூனிட்களிலிருந்து கட்டிட ஒப்பந்தகாரர்களுக்கு M-மணல் நம்பகமாக வழங்கப்படுகிறது. 6-சக்கரம் மற்றும் 10-சக்கர லாரிகளில் கிடைக்கும்.",
    s3t: "உலர் புல் ரோல்கள்",
    s3d: "சேலம் அருகே உள்ள பண்ணைகளிலிருந்து உலர் புல் ரோல்கள் மற்றும் வைக்கோல் கட்டுகளை பால் பண்ணைகள் மற்றும் கால்நடை உரிமையாளர்களுக்கு கொண்டு செல்கிறோம்.",
    s4t: "ஆற்று மணல்",
    s4d: "சேலம் அருகே அங்கீகரிக்கப்பட்ட குவாரிகளிலிருந்து உரிமம் பெற்ற ஆற்று மணல் போக்குவரத்து. தமிழ்நாடு அரசு விதிமுறைகளுக்கு முழுமையாக இணங்கியது.",
   
    contactTag: "தொடர்பு கொள்ளுங்கள்", 
contactTitle: "எங்களை தொடர்புகொள்ளுங்கள்",
contactSub: "சேலத்தை மையமாக கொண்டு செயல்படுகிறோம். தமிழ்நாட்டின் எங்கும் செங்கல் மற்றும் மணல் கொண்டு செல்ல தயாராக உள்ளோம்.",
driversTag: "எங்கள் வாகனப் படை", driversTitle: "எங்கள் ஓட்டுநர்களை சந்திக்கவும்",
driversSub: "உங்கள் பொருட்களை பாதுகாப்பாகவும் சரியான நேரத்திலும் வழங்க அனுபவம் வாய்ந்த ஓட்டுநர்கள் தயார்.",
noDrivers: "ஓட்டுநர் விவரங்கள் விரைவில் இங்கே தோன்றும்.", driverLoading: "ஓட்டுநர்கள் ஏற்றப்படுகின்றனர்…",
driverAvailable: "கிடைக்கும்", driverOnDuty: "பணியில்", driverOffDuty: "பணியில் இல்லை",

officeLabel: "முகவரி", 
phoneLabel: "தொலைபேசி", 
emailLabel: "மின்னஞ்சல்", 
hoursLabel: "பணிநேரம்",

officeDetail: "எண் 15, மேல் வகுத்தானூர், பெரியேரிப்பட்டி, ஓமலூர் (வட்டம்), சேலம் (மாவட்டம்), தமிழ்நாடு - 636503",
phoneDetail: "+91 9787216797",
emailDetail: "elumalaitn30r0834@gmail.com",
hoursDetail: "திங்கள் – ஞாயிறு: 24 மணி நேர சேவை",

formTitle: "செய்தி அனுப்புங்கள்",
namePh: "உங்கள் பெயர்", 
emailPh: "மின்னஞ்சல் முகவரி", 
subjectPh: "பொருள்", 
msgPh: "உங்கள் செய்தி…",
sendBtn: "செய்தி அனுப்பு",
    // Footer
    footerDesc: "செங்கல், M-மணல், ஆற்று மணல் மற்றும் உலர் புல் ரோல்களுக்கான சேலம் தலைமையக லாரி சேவை. 2010 முதல் தமிழ்நாட்டிற்கு சேவை செய்கிறோம்.",
    quickLinks: "விரைவு இணைப்புகள்", footerServices: "சேவைகள்", legal: "சட்ட விவரங்கள்", downloadApp: "ஆப் பதிவிறக்கம்",
    fl1: "முகப்பு", fl2: "எங்களை பற்றி", fl3: "சேவைகள்", fl4: "தொடர்பு", fl5: "வேலைவாய்ப்பு",
    fs1: "செங்கல் போக்குவரத்து", fs2: "M-மணல் டெலிவரி", fs3: "உலர் புல் ரோல்கள்", fs4: "ஆற்று மணல்", fs5: "கலப்பு சுமைகள்", fs6: "மொத்த புல் & தீவனம்",
    ll1: "தனியுரிமை கொள்கை", ll2: "சேவை விதிமுறைகள்", ll3: "திரும்பப் பெறும் கொள்கை",
    copyright: "ஸ்ரீ அம்மன் டிரான்ஸ்போர்ட் கோ. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
    madeIn: "சேலம், தமிழ்நாட்டில் ❤️ உடன் உருவாக்கப்பட்டது",
    // Stocks
    stocksTag: "நேரடி சரக்கு", stocksTitle: "கிடைக்கும் லாரி இடங்கள்",
    stocksWelcome: "மீண்டும் வரவேற்கிறோம்,", stocksDesc: "செங்கல், M-மணல், உலர் புல் ரோல்கள் மற்றும் ஆற்று மணலுக்கான தற்போதைய கிடைக்கும் லாரி இடங்கள்.",
    totalRoutes: "மொத்த பட்டியல்கள்", available: "கிடைக்கும்", fullyBooked: "முழுவதும் முன்பதிவு",
    material: "பொருள்", vehicleType: "வாகன வகை", capacity: "திறன்", slots: "கிடைக்கும் இடங்கள்",
    price: "விலை / சுமை", status: "நிலை", action: "செயல்",
    book: "முன்பதிவு", fullLabel: "முழுவதும் முன்பதிவு",
    stockNote: "சரக்கு தரவு ஒவ்வொரு 5 நிமிடத்திலும் புதுப்பிக்கப்படும். விலைகள் ஒரு லாரி சுமைக்கு தோராயமானவை.",
    // Slides
    slide1tag: "ஸ்ரீ அம்மன் டிரான்ஸ்போர்ட் · சேலம்", slide1title: "நம்பகமான பொருள் போக்குவரத்து,", slide1accent: "ஆன்லைனில் லாரி முன்பதிவு",
    slide1sub: "கட்டுமானப் பொருட்கள், செங்கல், மணல் மற்றும் விவசாயப் பொருட்களுக்கு சேலத்திலிருந்து தமிழ்நாடு முழுவதும் பாதுகாப்பான, சரியான நேரத்தில் லாரி சேவை.",
    slide2tag: "செங்கல் போக்குவரத்து", slide2title: "முதல் தர சேம்பர் செங்கல்கள்,", slide2accent: "சூளையிலிருந்து தளத்திற்கே டெலிவரி",
    slide2sub: "சேலம் சூளைகளிலிருந்து உயர்தர சேம்பர் செங்கல்களை முழு லாரி சுமைகளாக உடனுக்குடன் உங்கள் கட்டிட தளத்திற்கு பாதுகாப்பாக கொண்டு செல்கிறோம்.",
    slide3tag: "M-மணல் & ஆற்று மணல்", slide3title: "உரிமம் பெற்ற தரமான மணல்,", slide3accent: "வலுவான கட்டுமானத்திற்கு",
    slide3sub: "சேலம் க்ரஷிங் யூனிட்களிலிருந்து தரமான M-மணல் மற்றும் உரிமம் பெற்ற ஆற்று மணல் — 6-சக்கர, 10-சக்கர லாரிகளில் சரியான நேரத்தில் டெலிவரி.",
    slide4tag: "விவசாய தீவனம்", slide4title: "பண்ணை உலர் புல் ரோல்கள்,", slide4accent: "கால்நடைகளுக்கான பசுந்தீவனம்",
    slide4sub: "சேலம் பண்ணைகளிலிருந்து நேரடியாக சேகரிக்கப்பட்ட உலர் புல் ரோல்கள் மற்றும் வைக்கோல் கட்டுகள் பால் பண்ணைகளுக்கு லாரிகளில் விரைவாக வழங்குகிறோம்.",
  },
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [lang,  setLang]  = useState(() => localStorage.getItem("lang")  || "en");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem("lang", lang); }, [lang]);

  const toggleTheme = () => setTheme((v) => (v === "dark" ? "light" : "dark"));
  const toggleLang  = () => setLang((v)  => (v === "en"   ? "ta"    : "en"));

  const t = translations[lang];
  const tr = (value) => translateValue(value, lang);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, lang, toggleLang, t, tr }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
