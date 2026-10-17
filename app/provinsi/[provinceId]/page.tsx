import React from "react";
import { ProvinceDashboardView } from "@/components/province/ProvinceDashboardView";

interface ProvincePageProps {
  params: {
    provinceId: string;
  };
}

export default function ProvincePage({ params }: ProvincePageProps) {
  return <ProvinceDashboardView provinceId={params.provinceId} />;
}
