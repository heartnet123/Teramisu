"use client";

import * as React from "react";
import Icon from "./icon";

export default function IconCart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 3h2l2.6 12.3a2 2 0 0 0 2 1.7h8.6a1 1 0 0 0 .98-.8L21 7H6" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </Icon>
  );
}