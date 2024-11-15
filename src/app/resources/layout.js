import React from "react";
import MainFooter from "../components/footer/MainFooter";


export default function ProfileLayout({children}){
    return(<>
        <div className="childLayout">
            {children}
            <MainFooter />
        </div>
    </>)
}
