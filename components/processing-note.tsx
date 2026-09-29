"use client";

import type {ReactNode} from "react";

type Props = {
  title: string;
  children: ReactNode;
  details?: ReactNode;
  local?: boolean;
};

export default function ProcessingNote({title, children, details, local = false}: Props) {
  return <div className={`privacy-note ${local ? "local" : ""}`}>
    <strong>{title}</strong>
    <p>{children}</p>
    {details && <details><summary>How processing works</summary><div>{details}</div></details>}
  </div>;
}
