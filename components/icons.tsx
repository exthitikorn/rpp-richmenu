import * as React from "react";
import Image, { type StaticImageData } from "next/image";
import rppLogo from "@images/rpp-logo.png";

import { siteConfig } from "@/config/site";

export const logoImage: StaticImageData = rppLogo;

export type LogoProps = {
  size?: number;
  className?: string;
  alt?: string;
};

export const Logo: React.FC<LogoProps> = ({
  size = 36,
  className,
  alt = siteConfig.hospitalName,
}) => (
  <Image
    priority
    alt={alt}
    className={className}
    height={size}
    src={rppLogo}
    width={size}
  />
);
