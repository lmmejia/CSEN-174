export default function Signup() {
  return (
    <main>
      <h1>Join Scurry!</h1>

      <form onSubmit={(e) => e.preventDefault()}>
        <input type="text" placeholder="Email" />
        <input type="password" placeholder="Password (6+ characters)" />
        <button type="submit">Sign Up</button>
      </form>

      <p role="status"></p>
    </main>
  );
}