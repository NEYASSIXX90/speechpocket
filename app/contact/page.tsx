import type {Metadata} from "next";
import {Mail} from "lucide-react";
import SiteChrome from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Contact Voculo",
  description: "Get in touch with Voculo about the tools, privacy, or a processing issue.",
  alternates: {canonical: "/contact"},
};

export default function ContactPage() {
  const email = process.env.SUPPORT_EMAIL || "support@voculo.com";
  return <SiteChrome className="legal-shell"><main className="contact-page page-frame" id="main-content">
    <p className="section-label">Support</p>
    <h1>Need a hand?</h1>
    <p>Tell us which tool you used, what you expected, and what happened. Please do not send recordings or sensitive information by email.</p>
    <a className="contact-email" href={`mailto:${email}`}><Mail size={18}/>{email}</a>
    <p className="contact-privacy">For privacy questions, include “Privacy request” in the subject. Do not attach an audio file.</p>
  </main></SiteChrome>;
}
