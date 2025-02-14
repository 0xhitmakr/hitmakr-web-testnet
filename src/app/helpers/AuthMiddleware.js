"use client"

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { usePathname } from 'next/navigation';
import RouterPushLink from './RouterPushLink';
import { useDisconnect } from 'wagmi';

const PUBLIC_ROUTES = ['/profile'];

export default function AuthMiddleware({ children }) {
    const { isConnected, status: accountStatus } = useAccount();
    const pathname = usePathname();
    const { routeTo } = RouterPushLink();

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const authToken = localStorage.getItem("@appkit/siwx-auth-token");

    useEffect(() => {
        if (isPublicRoute) {
            return;
        }

        if ((!isConnected && accountStatus==="disconnected" && !authToken)) {
            routeTo('/auth');
        }
    }, [isConnected,  isPublicRoute, accountStatus]);

    if (isPublicRoute) {
        return <>{children}</>;
    }

    if (!isConnected) {
        return null;
    }

    return <>{children}</>;
}