"use client";
import { useEffect, useRef } from "react";
import { initializeNavigation, navigationContents } from "../../assets/site-navigation.mjs";
import "../../assets/site-navigation.css";

export default function SiteNavigation({ base }: { base: string }) {
  const element = useRef<HTMLElement>(null);
  useEffect(() => initializeNavigation(element.current), []);
  return <><div id="atlas-top" /><nav ref={element} className="atlas-site-nav" aria-label="全站导航" dangerouslySetInnerHTML={{ __html: navigationContents('index.html', base) }} /></>;
}
