# BidHub – Noroff Student Auction House

BidHub is a semester project built for the Noroff Auction API.  
It’s a student-only auction platform where users can register with their `@stud.noroff.no` email, create listings, and bid using credits instead of cash.

---

## Features

### Public (logged-out) users

- View **landing page** with featured auctions
- Browse **all auctions** on the Auctions page
- Search listings by title/description
- View **single listing** details:
  - Title, description, media gallery
  - Seller info
  - Time remaining (countdown)
  - Bid history

> Guests can browse everything but **must log in to place bids** or create listings.

---

### Authenticated users

- **Register** with a valid `@stud.noroff.no` email
- **Log in** with Noroff Auction API v2
- **Credits** shown in the header on every page when logged in
- **Logout** button in profile dropdown

---

### Profile & account

- Profile page:
  - Banner (default if user has no custom banner)
  - Circular avatar
  - Name, email, and **current credits**
  - Bio text
  - Quick stats (total listings, total bids)
  - “Create listing” button
  - Recent listings created
  - Recent auctions the user has bid on
- Edit profile:
  - Update avatar URL
  - Update banner URL
  - Edit bio

---

### Listings & auctions

- **Create listing**
  - Title
  - Description
  - End date/time (`endsAt`)
  - Up to **two image URLs**
- **Edit listing**
  - Update title, description, end date/time, images
  - Only the **owner** of the listing can edit
- **Delete listing**
  - Confirmation prompt
  - Redirect back to _My listings_ after deletion
- **My listings** page
  - Shows all listings created by the logged-in user in card layout
  - Each card: title, image, time remaining, bids count, and actions (view / edit)

---

### Bidding

- **Place bids** on other users’ listings
- Validation:
  - Must be logged in
  - Must not be the seller of the listing
  - Bid must be **higher** than current highest bid
- After a successful bid:
  - Listing data reloads
  - **Bid history updates**
  - User’s **credits are refreshed** from the API and header updates
- **My bids** page
  - Shows all auctions the user has placed bids on
  - Card-style layout with images, titles, time remaining, and status

---

## Tech Stack

- **HTML5**
- **SCSS (Sass)** with `@use`
- **Bootstrap 5.3**
- **Vanilla JavaScript**
- **Noroff Auction API v2**
- Deployed to **Netlify**

---

## Live Demo

👉 **Live Site:** https://bidhub-site.netlify.app/  
👉 **GitHub Repo:** https://github.com/Shamia702/SP2-BidHub

---

## Setup & Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/Shamia702/SP2-BidHub.git
cd SP2-BidHub
code .
```


### 2. Install dependencies

```bash
npm install
```
### 3. Run Sass in development mode

```bash
npm run dev
```
###  Open the project in VS Code

1. Open the folder in **Visual Studio Code**.
2. Install the **Live Server** extension if you don’t have it already.
3. Open the terminal in VS Code and run the following commands:
````
