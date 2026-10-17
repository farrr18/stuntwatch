import React from "react";
import { ProvinceDashboardView } from "@/components/province/ProvinceDashboardView";

interface KabKotaDeepLinkPageProps {
  params: Promise<{
    provinceId: string;
    kabKotaId: string;
  }>;
}

export default async function KabKotaDeepLinkPage({
  params,
}: KabKotaDeepLinkPageProps) {
  const { provinceId, kabKotaId } = await params;

  return (
    <ProvinceDashboardView
      provinceId={provinceId}
      initialKabKotaId={kabKotaId}
    />
  );
}
