import Link from "next/link";
import "./styles/landing.css";

//Landing page with nav
export default function Landing() {
  return (
    <main className="landing-container">
      <h1>Welcome to Scurry!</h1>
      <p>Do not waste time, start scurrying around campus</p>

      <div className="button-container">
        <Link href="/login" className="btn">LOG IN </Link>
        <Link href="/signup" className="btn">SIGN UP</Link>
      </div>
    </main>
  );
}