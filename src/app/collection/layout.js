import React from "react";
import { getMetadata } from "@/lib/metadata/LayoutsMetadata";
import MainFooter from "../components/footer/MainFooter";


export default function CollectionLayout({children}){
    return(<>
        <div className="childLayout">
            {children}
            <MainFooter />
        </div>
    </>)
}
