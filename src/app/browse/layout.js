import React from "react";
import styles from "./styles/Browse.module.css";
import { getMetadata } from "@/lib/metadata/LayoutsMetadata";
import MainFooter from "../components/footer/MainFooter";

export const metadata = getMetadata('browse');


export default function BrowseLayout({children}){
    return(<>
        <div className="childLayout">
            {children}
            <MainFooter />
        </div>
    </>)
}
