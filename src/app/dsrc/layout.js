import React from "react";
import MainFooter from "../components/footer/MainFooter";

export default function DSRCLayout({children}){
    return(<>
        <div className="childLayout">
            {children}
            <MainFooter />
        </div>
    </>)
}
