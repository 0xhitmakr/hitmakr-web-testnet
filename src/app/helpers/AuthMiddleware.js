"use client"

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useSIWE } from 'connectkit';
import { usePathname } from 'next/navigation';
import RouterPushLink from './RouterPushLink';

const PUBLIC_ROUTES = ['/profile'];

export default function AuthMiddleware({ children }) {
    const { isConnected, status: accountStatus } = useAccount();
    const { isSignedIn, status: siweStatus } = useSIWE();
    const pathname = usePathname();
    const { routeTo } = RouterPushLink();

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);


    useEffect(() => {
        if (isPublicRoute) {
            return;
        }

        if ((!isConnected && accountStatus==="disconnected") || (!isSignedIn && siweStatus==="ready")) {
            routeTo('/auth');
        }
    }, [isConnected, isSignedIn, isPublicRoute, accountStatus, siweStatus]);

    if (isPublicRoute) {
        return <>{children}</>;
    }

    if (!isConnected || !isSignedIn) {
        return null;
    }

    return <>{children}</>;
}