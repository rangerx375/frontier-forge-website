# 🚀 BUILD GOOGLE CALENDAR INTEGRATION - JUST SAY "GO"

> **Complete autonomous build** - All credentials in `.env.calendar` file. Claude Code reads that file and executes everything below.

---

## QUICK START

**On your phone, in GitHub, just say to Claude Code:**

> "Read `/voice-ai-agency/agents/airbnb-mansion-in-the-sky/.env.calendar` and execute this entire GO.md document. Build the Google Calendar integration for the Airbnb agent from start to finish."

Claude will:
1. ✅ Generate Google OAuth refresh token
2. ✅ Build Modal serverless functions  
3. ✅ Deploy to Modal
4. ✅ Test functions directly
5. ✅ Wire to Retell AI agent
6. ✅ Test end-to-end via chat
7. ✅ Refine prompt if needed
8. ✅ Update agent registry

**You don't do anything. Close your laptop.**

---

## CREDENTIALS

All credentials are in `.env.calendar` (local file, not in git):

```bash
# Load credentials
source .env.calendar

# Verify
echo "Google Client ID: $GOOGLE_CLIENT_ID"
echo "Calendar: $GOOGLE_CALENDAR_ID"  
echo "Retell Agent: $RETELL_AGENT_ID"
echo "Modal Token: $MODAL_TOKEN_ID"
```

---

## BUILD STEPS

### STEP 1: Generate Google OAuth Refresh Token

**Script:** `generate-refresh-token.py`

```python
#!/usr/bin/env python3
import os
from google_auth_oauthlib.flow import InstalledAppFlow
import json

# Load from .env.calendar
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

with open('/tmp/oauth_creds.json', 'w') as f:
    json.dump(creds_json, f)

flow = InstalledAppFlow.from_client_secrets_file('/tmp/oauth_creds.json', scopes=SCOPES)
creds = flow.run_local_server(port=8080)

print(f"\n✅ Refresh Token: {creds.refresh_token}")

# Auto-update .env.calendar
with open('.env.calendar', 'r') as f:
    env_content = f.read()

env_content = env_content.replace(
    'GOOGLE_REFRESH_TOKEN=# Generate this in Step 1',
    f'GOOGLE_REFRESH_TOKEN={creds.refresh_token}'
)

with open('.env.calendar', 'w') as f:
    f.write(env_content)

print("✅ Updated .env.calendar with refresh token")
```

**Run:**
```bash
pip install google-auth-oauthlib google-api-python-client
python3 generate-refresh-token.py
```

---

### STEP 2 & 3: Build and Deploy Modal Functions

See `BUILD-GOOGLE-CALENDAR-INTEGRATION.md` Step 2 for full code.

**Quick deploy:**
```bash
# Modal functions auto-read from environment
export $(cat .env.calendar | grep -v '^#' | xargs)

modal deploy check-availability.py
modal deploy book-appointment.py
```

Save the Modal URLs to `.env.calendar`:
```bash
CHECK_AVAILABILITY_URL=https://xxx.modal.run
BOOK_APPOINTMENT_URL=https://yyy.modal.run
```

---

### STEP 4: Test Functions

```bash
# Test check availability
curl -X POST $CHECK_AVAILABILITY_URL \
  -H "Content-Type: application/json" \
  -d '{"check_in": "2026-03-15", "check_out": "2026-03-22"}'

# Test booking
curl -X POST $BOOK_APPOINTMENT_URL \
  -H "Content-Type: application/json" \
  -d '{"check_in": "2026-03-15", "check_out": "2026-03-22", "guest_name": "Test", "guest_email": "test@example.com", "guest_phone": "555-1234", "group_size": 4}'
```

---

### STEP 5: Wire to Retell AI

**Script:** `wire-calendar-tools.py`

(See BUILD-GOOGLE-CALENDAR-INTEGRATION.md Step 5 for full script - it reads from .env.calendar)

**Run:**
```bash
python3 wire-calendar-tools.py
```

Updates agent with calendar tools, creates new agent, publishes.

---

### STEP 6: Test End-to-End

**Script:** `test-calendar-chat.py`

(See BUILD-GOOGLE-CALENDAR-INTEGRATION.md Step 6 - reads new agent ID from .env.calendar)

**Run:**
```bash
python3 test-calendar-chat.py
```

Tests full booking flow via chat agent.

---

### STEP 7: Refine Prompt

If booking flow isn't smooth, add to prompt:

```
CALENDAR BOOKING FLOW:
1. Dates requested → check_calendar_availability
2. Available → "Those dates work! Want to book?"
3. Collect: name, email, phone, group size
4. Confirm → create_calendar_booking
5. Give confirmation number
```

---

## SUCCESS CHECKLIST

- [ ] Refresh token generated and saved to .env.calendar
- [ ] Modal functions deployed, URLs in .env.calendar
- [ ] Direct function tests pass
- [ ] Tools added to Retell agent
- [ ] Chat test shows full booking flow working
- [ ] Booking appears in Google Calendar (techtomlet@gmail.com)
- [ ] Agent registry updated in CLAUDE.md
- [ ] Old agent marked deprecated

---

## TROUBLESHOOTING

**Can't find .env.calendar:**
- File is local only, not in git
- All credentials listed in this file
- Create it from BUILD doc Step 1

**Modal deploy fails:**
- Run: `modal token set --token-id $MODAL_TOKEN_ID --token-secret $MODAL_TOKEN_SECRET`

**Refresh token invalid:**
- Re-run Step 1 to generate new token
- Check Google Cloud Console APIs are enabled

**Booking doesn't create calendar event:**
- Check Modal logs: `modal app logs airbnb-calendar-book-appointment`
- Verify calendar ID is correct

---

**END - Just say "Go" and Claude builds everything**
