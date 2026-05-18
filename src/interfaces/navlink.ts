import type { NavLinkProps } from "react-router-dom";

export interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

export default {};
