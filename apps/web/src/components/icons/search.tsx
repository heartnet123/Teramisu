"use client";

import * as React from "react";
import Icon from "./icon";

export default function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Icon>
  );
}