import React from "react";
import { ProvinceDashboardView } from "@/components/province/ProvinceDashboardView";

interface ProvincePageProps {
  params: Promise<{
    provinceId: string;
  }>;
}

export default async function ProvincePage({ params }: ProvincePageProps) {
  const { provinceId } = await params;
  return <ProvinceDashboardView provinceId={provinceId} />;
}
