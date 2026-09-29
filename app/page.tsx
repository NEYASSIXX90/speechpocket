import Workbench from "@/components/workbench";
import type {Metadata} from "next";
export const metadata:Metadata={alternates:{canonical:"/"}};
export default function Home() { return <Workbench initialTool="audio-to-text" initialLocale="en" home />; }
