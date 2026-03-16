# Internal Pages Redesign Progress

## ✅ COMPLETED PAGES (4 of 8)

### 1. `/signup` - Signup Page ✅
**Status:** Complete and deployed (commit b2bc9e4)

**Features:**
- Logo with white icon at top
- Modern white card on gradient navy background
- Improved form inputs with focus states
- Loading spinner on submit button
- Error messages with icon and border-left accent
- Help text for password requirements
- Smooth hover animations

### 2. `/login` - Login Page ✅
**Status:** Complete and deployed (commit b2bc9e4)

**Features:**
- Matching logo and gradient background
- Remember me checkbox with better styling
- Forgot password link
- Loading state with spinner animation
- Improved error display with icons

### 3. `/onboard` - Onboarding Page ✅
**Status:** Complete and deployed (commit b2bc9e4)

**Features:**
- Progress indicator (Step 1 of 2: 50%)
- 5 questions in bordered gray cards
- Numbered question labels (1-5 in circles)
- Industry dropdown with emoji icons
- Radio buttons for pain points in card format
- Pricing summary card with gradient background
- Shows $97/mo with benefits

### 4. `/welcome` - Welcome Page ✅
**Status:** Complete and deployed (commit 86f3046)

**Features:**
- Loading state with spinning icon and progress bar
- Real-time progress steps with checkmarks
- Success state with large green checkmark
- Business number card (navy gradient)
- Control SMS card with example commands
- Blue alert banner
- Large CTA button to dashboard

---

## 🚧 REMAINING PAGES (4 of 8)

### 5. `/app` - Main Dashboard 🚧
**Status:** NOT STARTED
**File:** `src/app/(dashboard)/app/page.tsx`
**Lines:** 271

**Current Structure:**
- Header with AgentOS logo
- Dynamic greeting (Good morning/afternoon/evening)
- 3 stat cards (Calls Today, Commands Executed, Bot Status)
- Quick Commands (4 buttons grid)
- Recent Activity widget (last 5 commands)
- Active Skills widget
- Bot Info widget

**Needs:**
- Modern header with better navigation
- Redesigned stat cards with icons
- Improved quick command buttons
- Better activity feed design
- Skills cards with toggle states
- Info panel with gradient backgrounds

**Design Pattern to Follow:**
```tsx
// Header with logo and user menu
<header className="bg-white border-b border-gray-200">
  <div className="flex items-center justify-between px-6 py-4">
    <Logo />
    <UserMenu />
  </div>
</header>

// Stat Cards (3 columns)
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <StatCard
    title="Calls Today"
    value={callsToday}
    icon={<PhoneIcon />}
    trend="+12% from yesterday"
  />
</div>

// Activity Feed
<div className="bg-white rounded-2xl shadow-lg p-6">
  <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
  {activity.map(item => <ActivityItem {...item} />)}
</div>
```

---

### 6. `/app/activity` - Activity Log Page 🚧
**Status:** NOT STARTED
**File:** `src/app/(dashboard)/app/activity/page.tsx`
**Lines:** 318

**Current Structure:**
- Header with back button
- 3 stat cards (Total Commands, Total Calls, Success Rate)
- Tabs (Commands, Calls)
- Commands table with 6 columns
- Channel badges (colored pills)
- Empty states

**Needs:**
- Modern table design with hover states
- Better channel badges with icons
- Improved success/failure indicators
- Search and filter functionality
- Pagination controls
- Export button

**Design Pattern:**
```tsx
// Commands Table
<table className="w-full">
  <thead className="bg-gray-50 border-b border-gray-200">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">
        Time
      </th>
      {/* ... */}
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-100">
    {commands.map(cmd => (
      <tr className="hover:bg-gray-50 transition-colors">
        {/* ... */}
      </tr>
    ))}
  </tbody>
</table>
```

---

### 7. `/rep` - Rep Dashboard 🚧
**Status:** NOT STARTED
**File:** `src/app/(dashboard)/rep/page.tsx`
**Lines:** 285

**Current Structure:**
- Header with rep name and code
- 3 stat cards (Active Subscribers, Total MRR, Commission link)
- Subscribers table with plan badges
- "+ Send Demo" button
- Signup link box with copy button
- Empty state

**Needs:**
- Modern table with better styling
- Improved stat cards with gradients
- Better plan badges (Base + addons)
- Enhanced signup link section
- QR code modal
- Rep profile card

**Design Pattern:**
```tsx
// Subscribers Table
<div className="bg-white rounded-2xl shadow-lg overflow-hidden">
  <table className="w-full">
    <tbody>
      {subscribers.map(sub => (
        <tr className="border-b last:border-0 hover:bg-gray-50">
          <td className="px-6 py-4">
            <div className="font-bold text-gray-900">{sub.business_name}</div>
            <div className="text-sm text-gray-500">{sub.created_at}</div>
          </td>
          <td className="px-6 py-4">
            <div className="flex gap-2">
              <Badge>Base</Badge>
              {sub.skills.map(skill => <Badge key={skill}>{skill}</Badge>)}
            </div>
          </td>
          {/* ... */}
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

### 8. `/demos/new` - Send Demo Page 🚧
**Status:** NOT STARTED
**File:** `src/app/(dashboard)/demos/new/page.tsx`
**Lines:** 221

**Current Structure:**
- Header with "Send Demo" title
- Back button
- Intro box
- Form with 4 fields (name, phone, business type, note)
- Submit button
- "How It Works" section (5 steps)

**Needs:**
- Modern form layout with icons
- Better business type selector
- Phone input with validation
- Improved "How It Works" section
- Success confirmation modal
- Form validation feedback

**Design Pattern:**
```tsx
// Demo Form
<form className="space-y-6">
  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
    <label className="block text-sm font-bold text-[#1B3A7D] mb-3">
      <span className="flex items-center gap-2">
        <UserIcon className="w-5 h-5" />
        Prospect Name
      </span>
    </label>
    <input
      type="text"
      required
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B3A7D]"
      placeholder="John Doe"
    />
  </div>
  {/* ... */}
</form>
```

---

## 🎨 DESIGN SYSTEM REFERENCE

### Colors
```css
Navy: #1B3A7D
Red: #C7181F
White: #FFFFFF
Gray-50: #F9FAFB
Gray-100: #F3F4F6
Gray-200: #E5E7EB
```

### Typography
- Font: Arial
- Headings: font-bold
- Body: font-normal or font-medium

### Components

#### Card
```tsx
<div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
  {children}
</div>
```

#### Stat Card
```tsx
<div className="bg-white rounded-xl shadow-md p-6">
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm font-medium text-gray-600">{title}</span>
    <span className="text-2xl">{icon}</span>
  </div>
  <div className="text-3xl font-bold text-[#1B3A7D]">{value}</div>
  {trend && <div className="text-sm text-green-600 mt-1">{trend}</div>}
</div>
```

#### Button
```tsx
<button className="bg-[#C7181F] hover:bg-[#A01419] text-white font-bold px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
  {children}
</button>
```

#### Badge
```tsx
<span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
  {label}
</span>
```

#### Input
```tsx
<input
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B3A7D] focus:border-[#1B3A7D] outline-none transition-all text-gray-900"
  placeholder="..."
/>
```

---

## 📋 NEXT STEPS

### Priority 1: Main Dashboard (/app)
1. Create modern header component
2. Redesign stat cards with icons and trends
3. Improve quick command buttons
4. Redesign activity feed
5. Add skills toggle cards
6. Create info panel

### Priority 2: Activity Log (/app/activity)
1. Modernize table design
2. Add search and filter
3. Improve channel badges
4. Add pagination
5. Create export functionality

### Priority 3: Rep Dashboard (/rep)
1. Redesign subscribers table
2. Improve stat cards
3. Create QR code modal
4. Add rep profile section
5. Enhance signup link box

### Priority 4: Send Demo (/demos/new)
1. Modernize form layout
2. Add form validation
3. Improve business type selector
4. Create success modal
5. Enhance "How It Works" section

---

## 🚀 DEPLOYMENT CHECKLIST

- [x] /signup page
- [x] /login page
- [x] /onboard page
- [x] /welcome page
- [ ] /app dashboard
- [ ] /app/activity page
- [ ] /rep dashboard
- [ ] /demos/new page

---

## 💡 DESIGN NOTES

### Navigation
- Header should be sticky on all pages
- Logo always links to /app for subscribers
- User menu in top right with dropdown
- Sign out link always visible

### Responsive Design
- All pages must work on mobile (320px+)
- Use grid-cols-1 md:grid-cols-3 for stat cards
- Tables should scroll horizontally on mobile
- Forms should stack vertically on small screens

### Loading States
- All forms show loading spinner on submit
- Tables show skeleton loaders
- Stat cards show loading placeholder
- Smooth transitions between states

### Error Handling
- Red banners with icons
- Inline validation errors
- Toast notifications for success
- Clear error messages

### Accessibility
- Proper ARIA labels
- Keyboard navigation
- Focus states visible
- Screen reader friendly

---

## 📁 FILES TO MODIFY

```
src/app/(dashboard)/app/page.tsx           - Main dashboard
src/app/(dashboard)/app/activity/page.tsx  - Activity log
src/app/(dashboard)/rep/page.tsx           - Rep dashboard
src/app/(dashboard)/demos/new/page.tsx     - Send demo form
```

---

## 🔗 REFERENCE FILES

- Landing page design: `src/app/(public)/page.tsx`
- Auth pages design: `src/app/(auth)/*/page.tsx`
- Spec document: `INTERNAL-PAGES-SPEC.md`
- Brand guidelines: `CLAUDE.md`

---

**Last Updated:** Session ending at 4/4 auth pages complete
**Next Session:** Start with `/app` dashboard redesign
