import "./globals.css";
import { getMetadata } from "@/lib/metadata/LayoutsMetadata";
import HomeMainBar from "./components/navbars/HomeMainBar";
import Sidebar from "./components/navbars/Sidebar";
export const metadata = getMetadata('home');
import dynamic from "next/dynamic";
import MainPlayer from "./components/musicplayers/mainplayer/MainPlayer";
const HitmakrConfig = dynamic(() => import("./config/HitmakrConfig"), {
  ssr: false,
});


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <HitmakrConfig>
            <HomeMainBar />
            <Sidebar />
            {children}
            <MainPlayer />
        </HitmakrConfig>
      </body>
    </html>
  );
}
