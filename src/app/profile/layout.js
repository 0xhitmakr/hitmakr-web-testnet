import React from "react";
import { getMetadata } from "@/lib/metadata/LayoutsMetadata";
import MainFooter from "../components/footer/MainFooter";
import AuthMiddleware from "../helpers/AuthMiddleware";

export const metadata = getMetadata('profiles');

export default function ProfileLayout({children}){
    return(<>
        <AuthMiddleware>
            <div className="childLayout">
                {children}
                <MainFooter />
            </div>
        </AuthMiddleware>
    </>)
}
