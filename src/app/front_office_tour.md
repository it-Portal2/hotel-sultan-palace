# Front Office & Billing Demo Guide (Hinglish)

Yeh guide apko **Front Office** module ka detailed walkthrough aur demo dene me help karegi. Isme har section ka purpose, flow, aur naye features (jaise Billing & Transactions) ka explanation hai.

---

## 1. Dashboard (Overview)
**Flow:** Login karte hi sabse pehle Dashboard dikhta hai.
**Explain:** "Ye hamara main **Cockpit** hai. Yahan hotel ka live status 30 seconds me samajh aata hai."
- **Widgets:**
  - **Arrivals:** Aaj kitne guests aane wale hain.
  - **Departures:** Aaj kitne guests checkout karenge.
  - **In-House:** Abhi hotel me total kitne guests hain.
- **Occupancy Chart:** Donut chart dikhata hai ki kitne rooms occupied hain vs available.
- **Revenue Snapshot:** Aaj ki total kamai (Room + Services).

---

## 2. All Bookings (Reservations)
**Location:** Sidebar > Front Office > All Bookings
**Flow:**
1.  **Grid View:** Yahan saare bookings card format me dikhte hain.
2.  **Filters:** Upar tabs hain - *All, Arrivals, Departures, In-House*.
    - "Agar mujhe dekhna hai aaj kon aa raha hai, main bas 'Arrivals' pe click karunga."
3.  **Search:** "Main guest ke naam ya booking ID se turant search kar sakta hoon."

---

## 3. Room Availability (Calendar)
**Location:** Sidebar > Front Office > Room Availability
**Explain:** "Ye hamara visual calendar hai. Isse hum drag-and-drop karke nayi booking bana sakte hain ya dates change kar sakte hain."
- **Features to show:**
  - **Green Bars:** Confirmed bookings.
  - **Red Selection:** Maintenance block (agar koi room kharab hai).
  - **Tooltips:** Hover karne par guest ka naam aur amount dikhta hai.

---

## 4. Room View (Live Status)
**Location:** Sidebar > Front Office > Room View
**Explain:** "Ye housekeeping aur receptionist ke liye best view hai. Har room ka live status card pe dikhta hai."
- **Status Indicators:**
  - **Clean (Green):** Room ready hai.
  - **Dirty (Red):** Cleaning chal rahi hai.
  - **Occupied (Blue):** Guest andar hai.
- **Action:** Kisi bhi card pe click karke hum details dekh sakte hain.

---

## 5. Check-In & Guest Database
**Scenario:** Guest aata hai.
**Flow:**
1.  'Arrivals' list me jao > **Check-In** button dabao.
2.  **Drawer Opens (Right Side):**
    - "Ye hamara Quick Check-in Drawer hai. Yahan guest ki photo ID verify karo aur 'Confirm Check-in' dabao."
3.  **Guest Database:** Ek baar check-in ho gaya, guest ka data automatically **Guest Database** me save ho jata hai future visits ke liye.

---

## 6. Insert Transaction (New Feature 🔥)
**Location:** Sidebar > Front Office > Insert Transaction
**Explain:** "Agar guest ne restaurant me khana khaya ya laundry use ki, to hum charge yahan add karte hain."
**Demo Flow:**
1.  **Search Guest:** Left panel me guest ka naam search karo (e.g., "Rahul").
2.  **Select Guest:** Naam pe click karo.
3.  **Right Panel Form:**
    - **Category:** Select karo (e.g., *Food & Beverage* or *Laundry*).
    - **Amount:** Amount daalo (e.g., 500).
    - **Description:** Details likho (e.g., "Lunch - Paneer Tikka").
4.  **Click 'Confirm & Post Charge':**
    - "Jaise hi button dabaya, ye amount seedha guest ke bill (folio) me jud gaya aur 'Unsettled Folios' me update ho gaya."

---

## 7. Unsettled Folios (Balance Tracking)
**Location:** Sidebar > Front Office > Unsettled Folios
**Explain:** "Ye accountant ka favourite section hai. Yahan sirf wo guests dikhte hain jinka paisa dena baaki hai."
**Features:**
- List me **Outstanding Balance** Red color me dikhta hai.
- **Action:** Yahan se hum 'Settle' button daba kar partial payment ya full payment le sakte hain.

---

## 8. Checkout & Final Billing (Enhanced Flow 🔥)
**Scenario:** Guest ja raha hai aur uska checkout karna hai.
**Purana Issue:** Pehle bill generate karna padta tha, fir checkout hota tha. Process lamba tha.
**New Feature:** "Ab humne process ko smooth kar diya hai."

**Demo Flow:**
1.  'Departures' ya 'In-house' list me jao.
2.  **Check-Out** button dabao.
3.  **New Modal Opens:**
    - **Bill Summary Top Pe:** Sabse upar ab **Live Bill Summary** dikhta hai.
    - "Dekhiye, system ne khud calculate kar liya: Room Charges + Taxes + Food + Laundry."
    - Total, Paid Amount, aur **Balance Due** saaf dikhta hai.
4.  **Logic:**
    - Agar balance pending hai (Red), to staff paisa lega.
    - Agar settled hai (Green), to bas 'Process Checkout' dabana hai.
5.  **Automation:** Checkout karte hi room status 'Dirty' ho jayega aur housekeeping ko notification chala jayega.

---

## Summary
Is Front Office module se hum:
1.  **Fast Check-in/Check-out** kar sakte hain.
2.  **Bina galti ke billing** manage kar sakte hain (saare charges auto-add hote hain).
3.  **Staff Coordination** strong rehta hai (Housekeeping auto-updates).

Ye ek complete solution hai kisi bhi premium hotel ke liye.
