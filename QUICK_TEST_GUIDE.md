# Quick Test Guide

## 🧪 Test Real-Time Messages (5 minutes)

### Setup

1. **Terminal 1:** Start backend

   ```bash
   cd backend
   npm run dev
   ```

2. **Terminal 2:** Start frontend

   ```bash
   cd frontend
   npm run dev
   ```

3. **Browser 1 & 2:** Open localhost:5173 in two different browser windows

### Test Steps

#### User1 Side (Browser 1)

1. Login as User1
2. Search for User2
3. Click User2 → Opens conversation ✓
4. Type "Hello from User1" → Send
5. **Watch Browser 2** → Message should appear instantly
6. Open **Browser DevTools (F12)** → Console tab
7. Look for logs starting with ✅, 📨, 🆕

#### User2 Side (Browser 2)

1. Login as User2
2. Same conversation should be visible
3. Type "Hi User1" → Send
4. **Watch Browser 1** → Message should appear instantly
5. Check console for logs

### Expected Console Logs (in order)

```
✅ Socket connected: socket-id
📨 Message received: {conversationId, body, senderId}
✅ Message matches current conversation
🆕 Adding new message to state
```

### Success Criteria

- [ ] Message appears on sender side instantly
- [ ] Message appears on receiver side **without page refresh**
- [ ] Sender name displays correctly for each message
- [ ] Console shows logs (no errors)
- [ ] Both users see all messages

**If messages don't appear:**

- Check console for `❌` messages
- Verify both sockets connected (`✅ Socket connected`)
- Check if room was joined (`🚪 Joining room...`)

---

## 👥 Test Group Chat (3 minutes)

### Steps

1. User1 clicks "Group Chat" button
2. Search for 2-3 users
3. Enter group name (e.g., "TestGroup")
4. Click users to select them (checkboxes appear)
5. Click "Create Group" button
6. **Expect:** New group appears in conversation list

### Test Messages in Group

1. User1 sends message
2. User2 and User3 should see it instantly
3. User2 replies
4. All users see the reply

---

## 🔧 Troubleshooting

| Problem                  | Solution                                           |
| ------------------------ | -------------------------------------------------- |
| Socket not connected     | Check if backend is running on port 4000           |
| Messages not arriving    | Check console logs for socket/room errors          |
| Duplicate conversations  | Backend running old version, restart `npm run dev` |
| Group chat not appearing | Check for validation errors in console             |

---

## 📊 Debugging Checklist

- [ ] Backend running on localhost:4000
- [ ] Frontend running on localhost:5173
- [ ] Browser DevTools console open (F12)
- [ ] Looking for logs with ✅, 📨, 🚪 prefixes
- [ ] No `❌ Socket disconnected` in console
- [ ] Both users in same conversation room

---

## 🎉 Everything Working?

If all tests pass:

- ✅ No duplicate conversations
- ✅ Real-time messages working
- ✅ Group chat working
- ✅ Proper sender names
- ✅ No page refresh needed

**You're ready to go live!** 🚀
