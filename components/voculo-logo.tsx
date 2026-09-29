type Props = {
  compact?: boolean;
  inverse?: boolean;
};

export default function VoculoLogo({compact = false, inverse = false}: Props) {
  const ink = inverse ? "#FFFFFF" : "#0A0A0A";
  return <span className={`voculo-logo ${compact ? "compact" : ""}`}>
    <svg aria-hidden="true" viewBox="0 0 98 96" focusable="false">
      <path d="M0 0H20L49 74L78 0H98L59 96H39Z" fill={ink}/>
      <path d="M43 0H55V45L49 61L43 45Z" fill="#E0A533"/>
    </svg>
    {!compact && <span>voculo</span>}
  </span>;
}
