# Swan Swim Management - Comprehensive Feature Overview

## 1. Executive Dashboard & Business Intelligence
A central command center designed to give shareholders and managers an instant pulse on business health.
- **Real-Time Analytics**:
    - **Daily Student Volume**: Visual breakdown of student counts per day to optimize staffing and pool usage.
    - **Term Trends**: "Enrollments per Term" metrics to track growth and retention between seasons.
- **Operational Health**:
    - **Pending Tasks Widget**: A collaborative task tracker ensuring operation critical items (e.g., "Check Chemical Levels", "Call Waitlist") are never missed.
    - **Enrollment Configuration**: Visible settings for open/close dates ensuring term management transparency.

## 2. Advanced Scheduling Engine
The core of the application, engineered for high-performance and complex scheduling needs.
- **Optimized Weekday Schedule**:
    - **Parallel Data Fetching**: Custom backend architecture loads all 7 days simultaneously, reducing load times by 400%+.
    - **Visual Heatmap**: Classes are color-coded by fill rate (Green = Open, Red = Full) for instant availability assessment.
- **Interactive Student Grid (Timeslot View)**:
    - **Smart Navigation**: "Next/Previous" logic that intelligently skips empty days/hours to find the next active class instantly.
    - **Integrated Roster Management**:
        - **Attendance**: One-click marking (Present, Absent, Excused) with auto-trigger logic for makeup eligibility.
        - **Report Cards**: Status tracking (Not Created → Created → Given) directly on the roster interface.
        - **Remarks**: Quick-access notes for student progress logging.
    - **Dynamic Capacity Management**: Real-time ratio tracking (e.g., 3:1 for Preschool, 6:1 for Swimmer) prevents overbooking.
- **Class Management**:
    - **On-the-Fly Creation**: Managers can spawn new classes in seconds directly from the weekly view.
    - **Instructor Assignment**: Smart dialogs filter for active staff and prevent double-booking.

## 3. Student & CRM Module
A complete lifecycle management system for students and families.
- **360° Student Profiles**:
    - **Enrollment History**: A unified view of all current, past, and future classes.
    - **Financial Status**: Badges indicating "Paid", "Partial", or "Void" status visible immediately on the profile.
    - **Guardian Integration**: Direct links to parent profiles with one-tap contact options (email/phone).
- **Guardian Management**:
    - **Family View**: See all siblings under one account.
    - **Compliance**: "Waiver Signed" tracking with visual alerts for non-compliance.
    - **Notes System**: Dedicated "pinned" notes for critical family information (e.g., pickup authorizations).
- **Flexible Booking Workflows**:
    - **Trial Classes**: Dedicated "Prospective Student" booking flow that doesn't require full account creation upfront.
    - **Makeups**: Conflict-free makeup scheduler that only shows slots matching the student's level.
    - **Transfers**: Seamless "Move Student" logic that handles proration and roster updates automatically.

## 4. Financial Suite
Tightly integrated billing that removes the need for external accounting for daily ops.
- **Smart Invoicing**:
    - **Auto-Generation**: Invoices created automatically upon enrollment.
    - **Status Tracking**: Visual indicators for Payment Received, Partial Payment, and Voided transactions.
- **Payment Processing**:
    - **Multi-Method Support**: Record payments via Cash, Credit, Debit, or E-Transfer.
    - **Adjustments**: Capabilities to issue credits or void incorrect charges with audit trails.
- **Reporting**:
    - **Daily Revenue**: "Export to Excel" functionality allows precise end-of-day reconciliation for admins.

## 5. Security & Administration
Enterprise-grade controls to ensure data safety and operational integrity.
- **Role-Based Access Control (RBAC)**:
    - **Admin**: Full system configuration, financial reporting, and staff management.
    - **Manager**: Student/Class management and daily operations. 
    - **Supervisor**: Improving floor operations (Attendance, Remarks) without access to sensitive financial or personal data.
- **Multi-Location Support**: Built-in architecture to support multiple pool locations within a single tenant.
- **Audit Logging**: Backend tracking of critical actions (e.g., changing instructors, deleting enrollments) for accountability.
