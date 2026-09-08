import Link from "next/link";

export default function ProfileLink({ fname, lname, username, className = "" }) {
  const displayName = [fname, lname].filter(Boolean).join(" ") || username || "Peer";

  return (
    <Link
      href={`/profile/${username}`}
      className={`hover:text-primary-600 transition-colors font-medium ${className}`}
    >
      {displayName}
    </Link>
  );
}