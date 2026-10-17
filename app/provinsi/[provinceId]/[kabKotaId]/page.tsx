import React from "react";
import { ProvinceDashboardView } from "@/components/province/ProvinceDashboardView";

interface KabKotaDeepLinkPageProps {
  params: {
    provinceId: string;
    kabKotaId: string;
  };
}

export default function KabKotaDeepLinkPage({
  params,
}: KabKotaDeepLinkPageProps) {
  return (
    <ProvinceDashboardView
      provinceId={params.provinceId}
      initialKabKotaId={params.kabKotaId}
    />
  );
}
