# 🚀 BUILD GOOGLE CALENDAR - JUST SAY "GO"

**Complete autonomous build for Google Calendar integration with Airbnb voice agent.**

---

## RUN FROM YOUR PHONE

Open this file on GitHub mobile and paste this to Claude Code:

```
Execute voice-ai-agency/agents/airbnb-mansion-in-the-sky/GO.md 

Use these credentials (stored in .env.calendar locally):
GOOGLE_CLIENT_ID=[from .env.calendar]
GOOGLE_CLIENT_SECRET=[from .env.calendar]  
GOOGLE_CALENDAR_ID=[from .env.calendar]
RETELL_API_KEY=[from .env.calendar]
RETELL_AGENT_ID=[from .env.calendar]  
MODAL_TOKEN_ID=[from .env.calendar]
MODAL_TOKEN_SECRET=[from .env.calendar]

Build everything: refresh token → Modal functions → test → wire to Retell → test chat → done.
```

---

## WHAT CLAUDE WILL DO

1. ✅ Generate Google OAuth refresh token (auto-saved to .env.calendar)
2. ✅ Create + deploy 2 Modal serverless functions (check availability, book appointment)  
3. ✅ Test both functions directly with curl
4. ✅ Wire tools to Retell AI Airbnb agent (creates new agent + LLM)
5. ✅ Test end-to-end via chat agent (simulates real booking)
6. ✅ Refine prompt if booking flow not smooth
7. ✅ Update agent registry in CLAUDE.md
8. ✅ Mark old agent as deprecated

**You do nothing. Close laptop. Claude builds everything.**

---

## BUILD INSTRUCTIONS FOR CLAUDE

### Step 1: Load Credentials

Read credentials from `.env.calendar` file in this directory or from user's initial message.

Required:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET  
- GOOGLE_CALENDAR_ID
- RETELL_API_KEY
- RETELL_AGENT_ID
- RETELL_LLM_ID
- MODAL_TOKEN_ID
- MODAL_TOKEN_SECRET

### Step 2: Generate Refresh Token

Install deps:
```bash
pip install google-auth-oauthlib google-api-python-client
```

Create `generate-token.py`:
```python
#!/usr/bin/env python3
from google_auth_oauthlib.flow import InstalledAppFlow
import json, os

CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
SCOPES = ['https://www.googleapis.com/auth/calendar']

creds_json = {
    "installed": {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uris": ["http://localhost"],
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token"
    }
}

with open('/tmp/oauth.json', 'w') as f:
    json.dump(creds_json, f)

flow = InstalledAppFlow.from_client_secrets_file('/tmp/oauth.json', scopes=SCOPES)
creds = flow.run_local_server(port=8080)

print(f"REFRESH_TOKEN={creds.refresh_token}")

# Save to .env.calendar
with open('.env.calendar', 'a') as f:
    f.write(f"\nGOOGLE_REFRESH_TOKEN={creds.refresh_token}\n")
```

Run it, save token.

### Step 3: Build Modal Functions

Set Modal token:
```bash
modal token set --token-id $MODAL_TOKEN_ID --token-secret $MODAL_TOKEN_SECRET
```

Create `check-availability.py` (Modal function that queries Google Calendar for date range conflicts).

Create `book-appointment.py` (Modal function that creates calendar events with guest info).

Both functions use credentials from environment, return JSON responses.

Deploy both:
```bash
modal deploy check-availability.py
modal deploy book-appointment.py
```

Save the returned URLs.

### Step 4: Test Functions

```bash
curl -X POST {CHECK_URL} -H "Content-Type: application/json" \
  -d '{"check_in":"2026-03-15", "check_out":"2026-03-22"}'
  
curl -X POST {BOOK_URL} -H "Content-Type: application/json" \
  -d '{"check_in":"2026-03-15", "check_out":"2026-03-22", "guest_name":"Test", "guest_email":"test@test.com", "guest_phone":"555-1234", "group_size":4}'
```

Verify both work before proceeding.

### Step 5: Wire to Retell AI

Get current agent, extract LLM, add two custom tools:

1. `check_calendar_availability` - points to Modal check URL
2. `create_calendar_booking` - points to Modal book URL

Create NEW LLM with tools (Retell caching bug requires new LLM).
Create NEW agent with new LLM.
Publish with version "Calendar Integration".

Save new agent ID + LLM ID.

### Step 6: Test via Chat

Create temporary chat agent with new LLM.
Run realistic booking conversation:
- "Is March 15-22 available?"
- Agent checks calendar
- "Yes, want to book?"
- Collect name, email, phone, group size
- Agent creates booking
- Verify booking appears in Google Calendar

Delete chat agent when done.

### Step 7: Refine if Needed

If agent doesn't smoothly guide through booking, add to prompt:

```
CALENDAR BOOKING RULES:
1. Check availability FIRST before offering to book
2. Collect ALL info before booking: name, email, phone, group size
3. Confirm details before creating booking
4. Give confirmation number after success
```

Re-deploy if prompt updated.

### Step 8: Cleanup

- Update `/voice-ai-agency/agents/CLAUDE.md` agent registry
- Mark old agent as deprecated
- Delete test booking from calendar
- Verify chat agents cleaned up

---

## SUCCESS CRITERIA

✅ Modal functions deployed and tested  
✅ Tools added to Retell agent  
✅ Chat test shows full booking flow working  
✅ Real booking created in Google Calendar  
✅ Agent registry updated  
✅ Old agent deprecated

---

## CREDENTIALS FILE (.env.calendar)

This file is LOCAL ONLY (gitignored). Contains all credentials needed for build.

```bash
GOOGLE_CLIENT_ID=<from OAuth download>
GOOGLE_CLIENT_SECRET=<from OAuth download>
GOOGLE_CALENDAR_ID=techtomlet@gmail.com
GOOGLE_REFRESH_TOKEN=<generated in Step 2>

RETELL_API_KEY=key_8970cab8ef7afa92828075dc1280
RETELL_AGENT_ID=agent_f9fe4a9f738dbed8016b3b509b
RETELL_LLM_ID=llm_ea8789c087ef9e6c1d52f222397d

MODAL_TOKEN_ID=ak-O3yBOispI09LWz58LfKe81
MODAL_TOKEN_SECRET=as-6xl65FljxHUsuhPdOCYAs6

CHECK_AVAILABILITY_URL=<filled after Step 3>
BOOK_APPOINTMENT_URL=<filled after Step 3>
```

---

**END - Ready to run from phone. Just say "Go" with credentials.**
