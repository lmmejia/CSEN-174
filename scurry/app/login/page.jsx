"use client";
import {useState} from 'react';
import{
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
} from 'firebase/auth';
import {auth} from '../../lib/firebase';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Redirect to home page or dashboard after successful login
            window.location.href = '/profile'; // Redirect to home page after successful login
        } catch (error) {
            console.error('Error logging in:', error);
        }
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            // Redirect to home page or dashboard after successful login
            window.location.href = '/profile'; // Redirect to home page after successful login
        } catch (error) {
            console.error('Error logging in with Google:', error);
        }
    };

    return (
        <div>
            <h1 >Login</h1>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Login</button>
            </form>
            <button onClick={handleGoogleLogin}>Login with Google</button>
            <button onClick={() => window.location.href = '/signup'}>Sign Up</button>
        </div>
    );  
}