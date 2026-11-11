//needed (layout for the app)

import Navbar from "./navbar";
import "./globals.css";

//display the nav bar and the content of the page
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Scurry</title>
      </head>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}   