//needed (layout for the app)

//display the nav bar and the content of the page
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Scurry</title>
      </head>
      <body>
        <nav>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/profile">Profile</a></li>
            <li><a href="/map">Map</a></li>
            <li><a href="/setup">Setup</a></li>
            <li><a href="/randomizer">Randomizer</a></li>
            <li><a href="/login">Login</a></li>
          </ul>
        </nav>
        {children}
      </body>
    </html>
  );
}   