"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { wagmiAdapter } from "@/app/config/appkit/AppKitConfig";
import { siweConfig } from "@/app/config/appkit/SiweConfig";

export const SIWEContext = createContext({
  isAuthenticated: false,
  isAuthenticating: false,
  status: "ready",
  error: null,
  user: null,
  signIn: async () => {},
  signOut: async () => {},
});

export function SIWEProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState("ready");
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const initializeWeb3 = async () => {
      setStatus("loading");
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();

        

        if (data && data.address) {
          setIsAuthenticated(data.isAuthenticated);
          setUser({
            address: data.address,
            chainId: data.chainId,
          });
          setStatus("success");
        } else {
          setStatus("rejected");
        }

        setIsInitialized(true);
      } catch (err) {
        console.error("Failed to initialize:", err);
        setError(err.message);
        setStatus("error");
      }
    };

    initializeWeb3();
  }, []);

  const handleSignIn = async () => {
    setStatus("loading");
    try {
      setIsAuthenticating(true);
      setError(null);

      const nonceResponse = await fetch("/api/auth/nonce");
      const nonce = await nonceResponse.text();

      const messageParams = {
        domain: window.location.host,
        uri: window.location.origin,
        statement:
          "Hitmakr Signature Authentication. Click Sign-In and accept the Hitmakr Terms of Service (https://mirror.xyz/0xB5e80530244F95F4290aD33f5fA5cB28B73B4593/exKwR0S3ejOjAgEQsgXxfNJMsInKMpJiaez1mUiMmqE) and Privacy Policy (https://mirror.xyz/0xB5e80530244F95F4290aD33f5fA5cB28B73B4593/XhqhggYwVjA69c4rc6-vtUOqsp0Q0zJkrHL-Q1OIiXc). This request will not trigger a blockchain transaction or cost any gas fees.",
        nonce: nonce,
      };

      const message = siweConfig.createMessage({
        address: await wagmiAdapter.getConnectedAddress(),
        ...messageParams,
      });

      const signature = await wagmiAdapter.signMessage({ message });

      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
        // credentials: "include",
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || "Failed to verify signature");
      }


      if (verifyData.success) {
        localStorage.setItem("authToken", verifyData.token);
        setIsAuthenticated(true);
        setUser(verifyData.user);
        setStatus("success");
      } else {
        throw new Error("Authentication failed");
      }
    } catch (err) {
      console.error("Sign in failed:", err);
      setError(err.message);
      setIsAuthenticated(false);
      setUser(null);
      setStatus("error");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    setStatus("loading");
    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
        // credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to sign out");
      }

      localStorage.removeItem('authToken');
      setIsAuthenticated(false);
      setUser(null);
      setStatus("ready");
      
    } catch (err) {
      console.error("Sign out failed:", err);
      setError(err.message);
      setStatus("error");
    }
  };



  return (
    <SIWEContext.Provider
      value={{
        isAuthenticated,
        isAuthenticating,
        error,
        user,
        signIn: handleSignIn,
        signOut: handleSignOut,
      }}
    >
      {children}
    </SIWEContext.Provider>
  );
}

export function useSIWE() {
  return useContext(SIWEContext);
}

export default SIWEProvider;
