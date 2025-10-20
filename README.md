# Hotel Management Booking System

A modern, responsive hotel booking system built with Next.js, TypeScript, and Tailwind CSS. This project implements a complete booking flow with calendar functionality, room selection, add-ons, and checkout process.

## Features

### 🗓️ Calendar Component
- Dual month view calendar matching the Figma design
- Date range selection for check-in and check-out
- Navigation arrows for month switching
- Disabled past dates and proper date validation

### 🏨 Booking Flow
1. **Hero Section**: Interactive booking form with calendar integration
2. **Rooms Page**: Room listings with detailed information and cart functionality
3. **Add-ons Page**: Additional services and experiences
4. **Checkout Page**: Complete guest details, payment forms, and booking confirmation
5. **Confirmation Popup**: Success message with booking details

### 🔥 Firebase Integration
- Real-time data storage for bookings
- Guest information management
- Booking status tracking
- Secure data handling

### 🎨 Design System
- Matches Figma designs exactly
- Responsive design for all screen sizes
- Modern UI with smooth animations
- Consistent color scheme and typography

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Icons**: Heroicons, Lucide React
- **State Management**: React Hooks

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hotel-management
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a Firebase project
   - Enable Firestore Database
   - Get your Firebase configuration
   - Create a `.env.local` file with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── rooms/             # Rooms listing page
│   ├── add-ons/           # Add-ons selection page
│   └── checkout/          # Checkout and payment page
├── components/            # React components
│   ├── calendar/          # Calendar component
│   ├── home/              # Hero section
│   └── layout/            # Header and Footer
├── lib/                   # Utility functions
│   ├── firebase.ts        # Firebase configuration
│   └── bookingService.ts  # Booking management functions
└── public/                # Static assets
    ├── room-*.jpg         # Room images
    ├── addon-*.jpg        # Add-on images
    └── *.png              # Logos and icons
```

## Key Components

### Calendar Component (`src/components/calendar/Calendar.tsx`)
- Dual month view with navigation
- Date range selection
- Disabled past dates
- Responsive design

### Hero Component (`src/components/home/Hero.tsx`)
- Video background with overlay
- Interactive booking form
- Calendar integration
- Guest selection

### Rooms Page (`src/app/rooms/page.tsx`)
- Room listings with detailed information
- Shopping cart functionality
- Price calculations
- Booking flow integration

### Add-ons Page (`src/app/add-ons/page.tsx`)
- Additional services and experiences
- Quantity selectors
- Price calculations per stay/day/guest
- Cart management

### Checkout Page (`src/app/checkout/page.tsx`)
- Guest details form
- Address information
- Payment processing
- Booking confirmation

## Firebase Schema

### Bookings Collection
```typescript
interface Booking {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: {
    adults: number;
    children: number;
    rooms: number;
  };
  guestDetails: Array<{
    prefix: string;
    firstName: string;
    lastName: string;
    mobile: string;
    email: string;
  }>;
  address: {
    country: string;
    city: string;
    zipCode: string;
    address1: string;
    address2: string;
  };
  room: {
    id: string;
    name: string;
    price: number;
    type: string;
  };
  addOns: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  bookingId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Features in Detail

### Calendar Functionality
- **Dual Month View**: Shows current and next month side by side
- **Date Selection**: Click to select check-in and check-out dates
- **Navigation**: Arrow buttons to navigate between months
- **Validation**: Prevents selection of past dates
- **Visual Feedback**: Different colors for selected dates and date ranges

### Room Selection
- **Room Cards**: Detailed room information with images
- **Features & Amenities**: Comprehensive room details
- **Price Display**: Clear pricing with tax information
- **Cart Management**: Add/remove rooms from cart
- **Real-time Updates**: Cart updates immediately

### Add-ons System
- **Service Types**: Different pricing models (per stay, per day, per guest)
- **Quantity Selection**: Adjustable quantities for applicable services
- **Price Calculation**: Automatic price updates based on selections
- **Cart Integration**: Seamless integration with main booking flow

### Checkout Process
- **Guest Information**: Multiple guest support with detailed forms
- **Address Management**: Complete address collection
- **Payment Processing**: Secure payment form with validation
- **Terms & Conditions**: Required agreement checkboxes
- **Confirmation**: Success popup with booking details

## Responsive Design

The application is fully responsive and works on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team.

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS