//needed (layout for the app)

import Navbar from "./navbar";

//display the nav bar and the content of the page
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Scurry</title>
      </head>
      <body>
        <navbar />
        {children}
      </body>
    </html>
  );
}   