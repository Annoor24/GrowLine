// variant: "primary" | "secondary" | "soft". Pass as={Link} to="..." to render a router link.
export default function Button({ variant = "primary", as: Tag = "button", className = "", ...props }) {
  const extra = Tag === "button" && !props.type ? { type: "button" } : {};
  return <Tag className={`btn btn-${variant} ${className}`.trim()} {...extra} {...props} />;
}
