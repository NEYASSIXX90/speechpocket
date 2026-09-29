"use client";

import {useState} from "react";
import {ArrowDownToLine, Check, Copy} from "lucide-react";
import {Button} from "@/components/ui/button";

type Props = {contents: string; filename: string; downloadLabel?: string};

export default function ResultActions({contents, filename, downloadLabel = "Download TXT"}: Props) {
  const [status, setStatus] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(contents);
      setStatus("Copied");
    } catch {
      setStatus("Copy is unavailable in this browser");
    }
    window.setTimeout(() => setStatus(""), 1_800);
  }

  function download() {
    const url = URL.createObjectURL(new Blob([contents], {type: "text/plain;charset=utf-8"}));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  return <div className="result-actions">
    <div className="action-row">
      <Button variant="outline" onClick={copy}>{status === "Copied" ? <Check/> : <Copy/>}{status === "Copied" ? "Copied" : "Copy text"}</Button>
      <Button variant="outline" onClick={download}><ArrowDownToLine/>{downloadLabel}</Button>
    </div>
    <span role="status" aria-live="polite" className="sr-only">{status}</span>
  </div>;
}
